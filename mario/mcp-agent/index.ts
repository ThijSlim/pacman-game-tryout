import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "Weather Service",
  version: "1.0.0",
});


server.tool("implementMarioFeature", "Implement Mario Feature", {
  feature: z.string().describe("Feature to implement"),
}, (args, extra) => {
  return {
    content: [
      {
        type: 'text',
        text: `Implement the ${args.feature} feature inside the Mario Game File.\n\n1. Describe the feature and its mechanics in detail.\n2. Outline the steps required to implement the feature in the Mario Game File.\n3. Implement the feature inside the Mario Game file.`

      }
    ]
  };
});


server.resource(
  "marioGameFile",
  "config://app",
  async (uri) => ({
    contents: [{ uri: "/Users/thijslimmen/Documents/Projects/Xpirit/classic-video-games/mario/game.js", text: "Mario Game File is here" }],
  })
);


server.prompt("getMarioGameMechanics", "Get Mario Game Mechanics", {
  gameMechanic: z.string().describe("The Mario mechanic to describe in detail")
}, (args, extra) => {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Generate a detailed description of the ${args.gameMechanic} mechanic in Mario games. Make sure to include examples and how it affects gameplay.`
        },

      }
    ]
  };
});



const transport = new StdioServerTransport();
await server.connect(transport);