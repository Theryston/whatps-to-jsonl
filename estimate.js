import fs from "node:fs";
import { encoding_for_model } from "tiktoken";

const OPENAI_PRICES_PER_1K_TOKENS = {
    "gpt-3.5-turbo": 0.008,
    "davinci-002": 0.006,
    "babbage-002": 0.0004,
}

const USAGE_MESSAGE = `Usage: pnpm estimate <filePath>`;

async function main() {
    const filePath = process.argv[2];

    if (!filePath) {
        console.log(USAGE_MESSAGE);
        return;
    }

    const fileContent = await fs.promises.readFile(filePath, "utf8");
    const enc = encoding_for_model("gpt-3.5-turbo");
    const tokenCount = enc.encode(fileContent).length;
    console.log(`Token count: ${tokenCount}`);

    const thousandTokens = tokenCount / 1000;
    for (const model in OPENAI_PRICES_PER_1K_TOKENS) {
        const modelPrice = OPENAI_PRICES_PER_1K_TOKENS[model];
        const price = modelPrice * thousandTokens;
        console.log(`Price for model ${model}: ${price.toLocaleString("en-US", { style: "currency", currency: "USD" })}`);
    }
}

main()