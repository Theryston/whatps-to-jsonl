import fs from "node:fs";
import { encoding_for_model } from "tiktoken";

const USAGE_MESSAGE = `Usage: pnpm start <filePath> <assistantName> <outputPath> [--append]`;

async function main() {
    const filePath = process.argv[2];
    const assistantName = process.argv[3];
    const outputPath = process.argv[4];
    const appendFile = process.argv[5] === "--append";

    if (!filePath || !assistantName || !outputPath) {
        console.log(USAGE_MESSAGE);
        return;
    }

    if (!outputPath.endsWith(".jsonl")) {
        console.log("Output path must end with .jsonl");
        return;
    }

    if (appendFile && !fs.existsSync(outputPath)) {
        await fs.promises.appendFile(outputPath, "", "utf-8");
    }

    const fileStr = await fs.promises.readFile(filePath, "utf8");
    const messages = await getMessages(fileStr);
    const notAssistantPersonName = messages
        .find((message) => message.sender !== assistantName)
        ?.sender || 'someone else';
    const messagesByDay = groupMessagesBySameDay(messages);
    let jsonl = "";


    for (const day in messagesByDay) {
        const dayMessages = messagesByDay[day];

        if (!Array.isArray(dayMessages)) {
            continue;
        }

        let messagesOpenAIFormat = dayMessages
            .map((message) => ({
                role: message.sender === assistantName ? "assistant" : "user",
                content: message.text,
            }))

        if (!messagesOpenAIFormat.length) {
            continue;
        }

        if (messagesOpenAIFormat.length >= 2048) {
            messagesOpenAIFormat = messagesOpenAIFormat.slice(0, 2047);
        }

        const assistantMessages = messagesOpenAIFormat
            .filter((message) => message.role === "assistant");
        const userMessages = messagesOpenAIFormat
            .filter((message) => message.role === "user");

        if (!assistantMessages.length || !userMessages.length) {
            continue;
        }

        const finalMessages = [
            {
                role: "system",
                content: `A normal chat between the assistant called ${assistantName} and the user called ${notAssistantPersonName}`
            },
            ...messagesOpenAIFormat,
        ]

        jsonl += JSON.stringify({ messages: finalMessages }) + "\n";
        console.log(`Processed day ${day}`);
    }

    const enc = encoding_for_model("gpt-3.5-turbo");
    const tokens = enc.encode(jsonl);

    if (appendFile) {
        await fs.promises.appendFile(outputPath, jsonl, "utf-8");
    } else {
        await fs.promises.writeFile(outputPath, jsonl);
    }

    console.log(`Wrote the train data to ${outputPath} (${tokens.length} tokens)`);
}

function groupMessagesBySameDay(messages) {
    return messages
        .sort((a, b) => a.date - b.date)
        .reduce((acc, message, index) => {
            try {
                const day = message.date.toISOString().split("T")[0];
                if (!acc[day]) {
                    acc[day] = [];
                }
                acc[day].push(message);
                return acc;
            } catch (e) {
                console.error(e);
                return acc;
            }
        })
}

async function getMessages(fileStr) {
    const messages = [];
    const lines = fileStr.split("\n");

    let currentSender = null;
    let currentDate = null;
    let currentText = null;
    for (const line of lines) {
        const lineParts = line.split(" - ");

        if (lineParts.length !== 2) {
            currentText += line + "\n";
        } else {
            if (currentText || currentSender || currentDate) {
                messages.push({
                    sender: currentSender,
                    date: currentDate,
                    text: currentText.trim(),
                })

                currentSender = null;
                currentDate = null;
                currentText = null;
            }
            const endParts = lineParts.slice(1);
            const date = new Date(lineParts[0].trim());
            const allText = endParts.join("\n");
            const sender = allText.split(":")[0].trim();
            const text = allText.split(":").slice(1).join(":").trim();
            currentText = text;
            currentSender = sender;
            currentDate = date;
        }
    }

    return messages.filter(message => message.text && !["Missed voice call", "Missed video call", "<Media omitted>", "null"].includes(message.text));
}

main()