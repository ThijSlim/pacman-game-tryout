import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "Weather Service",
  version: "1.0.0",
});


// server.tool("getWeather", "", {
//   city: z.string().describe("The city to get weather for")
// }, (args, extra) => {
//   return {
//     content: [
//       {
//         type: 'text',
//         text: `Weather in ${args.city} is currently sunny with a temperature of 72°F.`
//       }
//     ]
//   };
// });

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