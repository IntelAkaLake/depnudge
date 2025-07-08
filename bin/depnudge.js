#!/usr/bin/env node

const { main } = require("../lib/core/main");
const { t } = require("../lib/utils/lang");

async function run() {
  process.on("uncaughtException", async (error) => {
    console.error(await t("bin.uncaught_exception"));
    console.error(error.message);
    console.error(await t("bin.stack_trace"));
    console.error(error.stack);
    process.exit(1);
  });

  process.on("unhandledRejection", async (reason, promise) => {
    console.error(await t("bin.unhandled_rejection"));
    console.error(reason);
    console.error(await t("bin.promise"));
    console.error(promise);
    process.exit(1);
  });

  process.on("SIGINT", async () => {
    console.log("\n" + await t("bin.goodbye"));
    process.exit(0);
  });

  try {
    await main();
  } catch (error) {
    console.error(await t("bin.fatal_error", { message: error.message }));
    console.error(error.stack);
    process.exit(1);
  }
}

run(); 