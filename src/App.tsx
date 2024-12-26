import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ListView } from "./ListView";
import { EditView } from "./EditView";
import { MigrationView } from "./MigrationView";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function App() {
  return (
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/collections" replace />} />
          <Route path="/collections">
            <Route index element={<ListView />} />
            <Route path=":collectionName" element={<ListView />} />
            <Route path=":collectionName/import" element={<MigrationView />} />
            <Route path=":collectionName/:itemId" element={<EditView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConvexProvider>
  );
}

export default App;
