import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function SettingsView() {
    const deployUrl = useQuery(api.settings.get, { key: "deployUrl" });
    const setSetting = useMutation(api.settings.set);
    const navigate = useNavigate();
    const [url, setUrl] = useState("");

    useEffect(() => {
        if (deployUrl) {
            setUrl(deployUrl);
        }
    }, [deployUrl]);

    const handleSave = async () => {
        await setSetting({ key: "deployUrl", value: url });
        navigate("/");
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl mb-4">Settings</h1>
            <div className="max-w-md">
                <label className="block mb-2">Deploy URL</label>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full p-2 border rounded"
                />
                <button
                    onClick={handleSave}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                >
                    Save
                </button>
            </div>
        </div>
    );
} 
