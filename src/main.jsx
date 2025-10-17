import { useState } from "react";
import './index.css';

export default function TerminalPortfolio() {
  const hostname = "drinor";
  const fileTree = {
    info: {
      "about.txt": "Hi! I'm Drinor, a developer passionate about building interactive web experiences.",
      "skills.txt": "Languages: JavaScript, Python, Go\nFrameworks: React, Next.js, Node.js\nOther: Git, Linux, Docker",
      projects: {
        "portfolio.txt": "Terminal Portfolio — A fun terminal-like interface to explore my work.",
        "blog.txt": "Personal blog — Sharing thoughts on code, design, and tech.",
      },
      contact: {
        "email.txt": "youremail@example.com",
        "github.txt": "https://github.com/yourusername",
        "linkedin.txt": "https://www.linkedin.com/in/yourusername/",
      },
      ".secret.txt": "This is a hidden file! Only visible with 'ls -a'."
    },
  };

  const [path, setPath] = useState([]);
  const [output, setOutput] = useState([]);
  const [input, setInput] = useState("");

  function getCurrentDir() {
    return path.reduce((dir, p) => dir[p], fileTree);
  }

  function getPromptPath() {
    if (path.length === 0) return `<span style="color: #3b82f6">~</span>`;
    return `<span style="color: #3b82f6">~${path.map(p => "/" + p).join("")}</span>`;
  }

  function promptString(cmd) {
    return `<span style="color: #00ff00">${hostname}@portfolio:</span>${getPromptPath()}<span style="color: #00ff00">$ ${cmd}</span>`;
  }

  function formatLsOutput(dir, showHidden = false) {
    return Object.keys(dir)
      .filter((key) => showHidden || !key.startsWith("."))
      .map((key) => {
        if (typeof dir[key] === "object") {
          return `<span style="color: #3b82f6">${key}</span>`;
        } else {
          return key;
        }
      })
      .join("  ");
  }

  function resolvePath(arg) {
    if (!arg || arg === "~") return [];
    const parts = arg.split("/");
    let newPath = [...path];

    for (const part of parts) {
      if (part === "..") {
        newPath.pop();
      } else if (part === "." || part === "") {
        continue;
      } else {
        const testDir = newPath.reduce((dir, p) => dir[p], fileTree);
        if (testDir[part] && typeof testDir[part] === "object") {
          newPath.push(part);
        } else {
          return null;
        }
      }
    }

    return newPath;
  }

  function isValidPath(testPath) {
    if (!testPath) return false;
    try {
      testPath.reduce((dir, p) => dir[p], fileTree);
      return true;
    } catch {
      return false;
    }
  }

  function handleCommand(cmd) {
    const parts = cmd.trim().split(" ");
    const base = parts[0];
    const arg = parts[1];
    const currentDir = getCurrentDir();

    switch (base) {
      case "ls":
        setOutput((o) => [...o, promptString(cmd), formatLsOutput(currentDir)]);
        break;
      case "ls -a":
        setOutput((o) => [...o, promptString(cmd), formatLsOutput(currentDir, true)]);
        break;
      case "cd": {
        if (!arg) {
          setPath([]);
          setOutput((o) => [...o, promptString(cmd)]);
        } else {
          const newPath = resolvePath(arg);
          if (isValidPath(newPath)) {
            setPath(newPath);
            setOutput((o) => [...o, promptString(cmd)]);
          } else {
            setOutput((o) => [
              ...o,
              promptString(cmd),
              `<span style="color: #00ff00">cd: no such directory: ${arg}</span>`,
            ]);
          }
        }
        break;
      }
      case "cat":
        setOutput((o) => [
          ...o,
          promptString(cmd),
          currentDir[arg]
            ? `<span style="color: #ffffff">${currentDir[arg]}</span>` // white output
            : `<span style="color: #00ff00">cat: ${arg}: No such file</span>`,
        ]);
        break;
      case "pwd":
        setOutput((o) => [
          ...o,
          promptString(cmd),
          `<span style="color: #00ff00">/home/${path.join("/")}</span>`,
        ]);
        break;
      case "clear":
        setOutput([]);
        break;
      case "help":
        setOutput((o) => [
          ...o,
          promptString(cmd),
          `<span style="color: #00ff00">Available commands: ls, ls -a, cd, cat, pwd, clear, help</span>`,
        ]);
        break;
      default:
        if (cmd.trim())
          setOutput((o) => [
            ...o,
            promptString(cmd),
            `<span style="color: #00ff00">${base}: command not found</span>`,
          ]);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleCommand(input);
    setInput("");
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: "black", color: "#00ff00" }}>
      <div className="max-w-3xl mx-auto">
        {output.map((line, i) => (
          <pre
            key={i}
            dangerouslySetInnerHTML={{ __html: line }}
            style={{
              fontSize: "16px",
              fontFamily: "'Ubuntu Mono', monospace",
              color: "#00ff00",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          />
        ))}
        <form onSubmit={handleSubmit} className="flex items-center">
          <span
            dangerouslySetInnerHTML={{ __html: `${hostname}@portfolio:${getPromptPath()}$ ` }}
            style={{
              fontSize: "16px",
              fontFamily: "'Ubuntu Mono', monospace",
              color: "#00ff00",
            }}
          />
          <input
            className="flex-1"
            style={{
              backgroundColor: "black",
              border: "none",
              outline: "none",
              boxShadow: "none",
              caretColor: "#00ff00",
              fontFamily: "'Ubuntu Mono', monospace",
              color: "#00ff00",
              fontSize: "16px",
              margin: 0,
              padding: 0,
            }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
        </form>
      </div>
    </div>
  );
}
