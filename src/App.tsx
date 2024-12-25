import RichTextEditor from "./components/richtext";
import { schema } from "./lib/schema";
import { ListView } from "./ListView";
import { ConvexProvider, ConvexReactClient } from "convex/react";
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function App() {
  return (
    <ConvexProvider client={convex}>
      <div>
        <ListView />
      </div>
    </ConvexProvider>
  );
}

export default App;
