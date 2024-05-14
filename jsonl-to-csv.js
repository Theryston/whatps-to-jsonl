import fs from "node:fs";

const USAGE_MESSAGE = `Usage: pnpm jsonl-to-csv <filePath> <outputPath>`;

async function main() {
    const filePath = process.argv[2];
    const outputPath = process.argv[3];
    const useTxt = process.argv[4] === "--txt";
    const uniqueFile = process.argv[5] === "--unique";

    if (!filePath || !outputPath) {
        console.log(USAGE_MESSAGE);
        return;
    }

    const fileContent = await fs.promises.readFile(filePath, "utf8");
    const lines = fileContent.split("\n");
    let globalCsv = 'system,user_messages,assistant_messages\n';

    for (let i = 0; i < lines.length; i++) {
        let csv = 'system,user_messages,assistant_messages\n';
        const line = lines[i];
        if (!line) continue;

        const { messages } = JSON.parse(line);
        const { content: system } = messages.find((message) => message.role === "system");
        const userMessages = messages
            .filter((message) => message.role === "user")
            .map((message) => message.content)
            .join("|")
            .split('\n')
            .join(' ')
            .split(',')
            .join(' ');
        const assistantMessages = messages
            .filter((message) => message.role === "assistant")
            .map((message) => message.content)
            .join("|")
            .split('\n')
            .join(' ')
            .split(',')
            .join(' ');

        csv += `${system},${userMessages},${assistantMessages}\n`;
        const outPathWithoutExtension = outputPath.split(".")[0];
        const outPath = `${outPathWithoutExtension}.${i}.${useTxt ? "txt" : "csv"}`;

        if (!uniqueFile) {
            await fs.promises.writeFile(outPath, csv);
        } else {
            globalCsv += csv.split("\n").slice(1).join("\n");
        }
    }

    if (uniqueFile) {
        await fs.promises.writeFile(outputPath, globalCsv);
    }
}

main()