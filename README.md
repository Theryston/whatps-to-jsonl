# Whatps to JSONL

This project can convert a chat exported from WhatsApp to a OpenAI JSONL for fine tuning your models

## Installing

Just clone the repository, then install de dependencies with the following command:

```bash
git clone https://github.com/Theryston/whatps-to-jsonl
cd whatps-to-jsonl
pnpm install
```

## How to use

Run the following command:

```bash
pnpm start <path-to-exported-chat-file> <the-person-name-in-conversation-who-should-be-the-ai> <the-output-file-path.jsonl> --append
```

Look that the `--append` flag should only be used if you want to append to the output file and not overwrite it.

example:

```bash
pnpm start "WhatsApp Chat with John.txt" "James" "output.jsonl" --append
```

## Estimate

You can estimate the cost of training with some data just typing the following command:

```bash
pnpm estimate <path-to-jsonl-file>
```

## Moderate

You can get the output jsonl and run a moderate process that uses OpenAI's Moderation API to remove everything that is not safe from your jsonl file. Just type the following command:

```bash
pnpm moderate <path-to-jsonl-file> <path-to-output-jsonl-file>
```