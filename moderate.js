import fs from "node:fs";
import OpenAI from "openai";

const USAGE_MESSAGE = `Usage: pnpm moderate <filePath> <outputPath>`;

const client = new OpenAI();

async function main() {
    const filePath = process.argv[2];
    const outputPath = process.argv[3];

    if (!filePath || !outputPath) {
        console.log(USAGE_MESSAGE);
        return;
    }

    if (!filePath.endsWith(".jsonl")) {
        console.log("Input path must end with .jsonl");
        return;
    }

    if (!outputPath.endsWith(".jsonl")) {
        console.log("Output path must end with .jsonl");
        return;
    }

    const fileContent = await fs.promises.readFile(filePath, "utf8");
    const lines = fileContent.split("\n");

    let jsonl = "";

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const { messages } = JSON.parse(line);
        const moderatedMessages = [];

        for (let j = 0; j < messages.length; j++) {
            const message = messages[j];
            const moderation = await client.moderations.create({ input: message.content })
            const isFlagged = moderation.results.find((result) => result.flagged);
            console.log(`[LINE: ${i + 1}, MESSAGE: ${j + 1}] ${isFlagged ? `Flagged: ${message.content}` : "Not flagged"}`);

            if (isFlagged) continue;
            moderatedMessages.push(message);
        }

        const moderatedLine = JSON.stringify({ messages: moderatedMessages });
        jsonl += moderatedLine + "\n";
    }

    await fs.promises.writeFile(outputPath, jsonl);
}

main()