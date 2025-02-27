import { memo, useState } from "react";
import { VSCodeButton, VSCodeTextField } from "@vscode/webview-ui-toolkit/react";

type AddProviderDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AddProviderDialog = ({ isOpen, onClose }: AddProviderDialogProps) => {
  const [providerName, setProviderName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiType, setApiType] = useState("OpenAI API");
  const [apiKey, setApiKey] = useState("");
  const [modelId, setModelId] = useState("");

  const handleSubmit = () => {
    // Handle form submission logic here
    console.log("Provider Name:", providerName);
    console.log("Base URL:", baseUrl);
    console.log("API Type:", apiType);
    console.log("API Key:", apiKey);
    console.log("Model ID:", modelId);
    onClose();
  };

  return (
    isOpen && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1100,
        }}
      >
        <div
          style={{
            backgroundColor: "var(--vscode-editor-background)",
            padding: "20px",
            borderRadius: "5px",
            border: "1px solid var(--vscode-editorWidget-border)",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
            width: "300px",
            color: "var(--vscode-editor-foreground)",
          }}
        >
          <h3 style={{ marginBottom: "10px" }}>添加供应商</h3>
          <form onSubmit={(e) => e.preventDefault()}>
            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="providerName" style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                供应商名称
              </label>
              <VSCodeTextField
                id="providerName"
                value={providerName}
                onChange={(e) => setProviderName((e.target as HTMLInputElement).value)}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="baseUrl" style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                基础URL
              </label>
              <VSCodeTextField
                id="baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl((e.target as HTMLInputElement).value)}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="apiType" style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                API类型
              </label>
              <VSCodeTextField
                id="apiType"
                value={apiType}
                onChange={(e) => setApiType((e.target as HTMLInputElement).value)}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="apiKey" style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                API Key
              </label>
              <VSCodeTextField
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey((e.target as HTMLInputElement).value)}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="modelId" style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                Model ID
              </label>
              <VSCodeTextField
                id="modelId"
                value={modelId}
                onChange={(e) => setModelId((e.target as HTMLInputElement).value)}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <VSCodeButton appearance="secondary" onClick={onClose} style={{ marginRight: "10px" }}>
                取消
              </VSCodeButton>
              <VSCodeButton type="submit" onClick={handleSubmit}>
                确定
              </VSCodeButton>
            </div>
          </form>
        </div>
      </div>
    )
  );
};

export default memo(AddProviderDialog);
