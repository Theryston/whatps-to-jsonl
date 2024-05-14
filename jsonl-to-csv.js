import fs from "node:fs";

const USAGE_MESSAGE = `Usage: pnpm jsonl-to-csv <filePath> <outputPath>`;

async function main() {
    const filePath = process.argv[2];
    const outputPath = process.argv[3];

    if (!filePath || !outputPath) {
        console.log(USAGE_MESSAGE);
        return;
    }

    const fileContent = await fs.promises.readFile(filePath, "utf8");
    const lines = fileContent.split("\n");
    let csv = 'system,user_messages,assistant_messages\n';

    for (const line of lines) {
        if (!line) continue;

        const { messages } = JSON.parse(line);
        const { content: system } = messages.find((message) => message.role === "system");
        const userMessages = messages
            .filter((message) => message.role === "user")
            .map((message) => message.content)
            .join("|")
        const assistantMessages = messages
            .filter((message) => message.role === "assistant")
            .map((message) => message.content)
            .join("|");

        csv += `${system},${userMessages},${assistantMessages}\n`;
    }

    await fs.promises.writeFile(outputPath, csv);
}

main()