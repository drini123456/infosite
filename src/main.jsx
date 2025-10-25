import { useState, useEffect, useRef } from "react";
import './index.css';

export default function TerminalPortfolio() {
  const hostname = "drinor";
  const fileTree = {
    ".secret.txt": "https://www.youtube.com/watch?v=D8m9SnrjpYY&list=RDD8m9SnrjpYY&start_radio=1",
    info: {
      "about.txt": "Hi! I'm Drinor Topalli, currently working as a System Engineer, with an interest in Cloud and DevOps.",
      "skills.txt": "Systems:\n  - Linux\n  - WS Management\n  - Networking fundamentals\n  - Virtualization\n\nAutomation:\n  - Bash\n  - PowerShell\n  - Ansible\n\nCloud:\n  - Azure\n  - IAM & RBAC\n\nContainerization:\n  - Docker\n\nCurrently learning Kubernetes, Golang and other cool stuff",
      projects: {
        "portfolio.txt": "Terminal Portfolio — A fun terminal-like interface to explore my work.",
      },
      contact: {
        "email.txt": "drinor.topalli@gmail.com",
        "github.txt": "https://github.com/drini123456",
      },
  
    },
  };

  const [path, setPath] = useState([]);
  const [output, setOutput] = useState([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [promptTop, setPromptTop] = useState(null);
  const promptRef = useRef(null);
  const inputRef = useRef(null);
  const mirrorRef = useRef(null);

  useEffect(() => {
    if (promptRef.current && promptTop === null) {
      setPromptTop(promptRef.current.getBoundingClientRect().top + window.scrollY);
    }
  }, [promptTop]);

  useEffect(() => {
    if (!inputRef.current || !mirrorRef.current) return;
    const mirror = mirrorRef.current;
    // Ensure there is always at least 1ch width
    mirror.textContent = (input && input.length > 0 ? input : " ") + " ";
    const w = mirror.offsetWidth;
    inputRef.current.style.width = (w || 1) + 'px';
  }, [input]);

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
      .map((key) => (typeof dir[key] === "object" ? `<span style="color: #3b82f6">${key}</span>` : key))
      .join("  ");
  }

  function resolvePath(arg) {
    if (!arg || arg === "~") return [];
    const parts = arg.split("/");
    let newPath = [...path];
    for (const part of parts) {
      if (part === "..") newPath.pop();
      else if (part === "." || part === "") continue;
      else {
        const testDir = newPath.reduce((dir, p) => dir[p], fileTree);
        if (testDir[part] && typeof testDir[part] === "object") newPath.push(part);
        else return null;
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

async function sendEmail(name, message) {
  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("message", message);
    formData.append("email", "no-reply@formspree.io"); // dummy email to satisfy validation

    const res = await fetch("https://formspree.io/f/movkonwq", {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    const data = await res.json();

    if (res.ok && (data.ok || data.next)) {
      return true;
    }

    console.error("Formspree error:", data);
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
}

  // ------------------------------------------------------------------

  function handleCommand(cmd) {
    const parts = cmd.trim().split(" ");
    const base = parts[0];
    const arg = parts.slice(1).join(" ");
    const currentDir = getCurrentDir();

    switch (base) {
      case "ls": {
        const showAll = arg === "-a" || arg === "--all";
        setOutput((o) => [
          ...o,
          promptString(cmd),
          formatLsOutput(currentDir, showAll),
        ]);
        break;
      }
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
            ? `<span style="color: #ffffff">${currentDir[arg]}</span>`
            : `<span style="color: #00ff00">cat: ${arg}: No such file</span>`,
        ]);
        break;
      case "pwd":
        setOutput((o) => [...o, promptString(cmd), `<span style="color: #00ff00">/home/${path.join("/")}</span>`]);
        break;
      case "clear":
        setOutput([]);
        break;
      case "help":
        setOutput((o) => [
          ...o,
          promptString(cmd),
          `<span style="color: #00ff00">Available commands: ls, ls -a, cd, cat, pwd, clear, help, echo</span>`,
        ]);
        break;

      // ---------------------- ADDITION: echo command ----------------------
      case "echo": {
        const echoMatch = arg.match(/^from:(\S+)\s+"(.+)"\s*>\s*(\S+)$/);
        if (echoMatch) {
          const [, from, message, to] = echoMatch;

          // Only send if recipient matches your email
          if (to === "drinor.topalli@gmail.com") {
            sendEmail(from, message).then((ok) => {
              setOutput((o) => [
                ...o,
                promptString(cmd),
                `<span style="color: #00ff00">${ok ? "Email sent successfully!" : "Failed to send email."}</span>`
              ]);
            });
          } else {
            setOutput((o) => [
              ...o,
              promptString(cmd),
              `<span style="color: #ff5555">Cannot send to ${to}. Only messages to drinor.topalli@gmail.com are allowed.</span>`
            ]);
          }
        } else {
          setOutput((o) => [
            ...o,
            promptString(cmd),
            `<span style="color: #00ff00">Usage: echo from:YourName "Message" > your-email</span>`
          ]);
        }
        break;
      }
      // ------------------------------------------------------------------

      default:
        if (cmd.trim())
          setOutput((o) => [...o, promptString(cmd), `<span style="color: #00ff00">${base}: command not found</span>`]);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (input.trim() !== "") {
      setHistory((prev) => [...prev, input]);
      setHistoryIndex(-1);
    }
    handleCommand(input);
    setInput("");
  }

  function autocompletePath(arg) {
    const parts = arg.split("/");
    const lastPart = parts.pop();
    let dir = getCurrentDir();
    for (const p of parts) {
      if (p === "" || p === ".") continue;
      if (p === "..") return arg;
      if (dir[p] && typeof dir[p] === "object") dir = dir[p];
      else return arg;
    }
    const files = Object.keys(dir);
    const matches = files.filter((f) => f.startsWith(lastPart));
    if (matches.length === 1) {
      const match = matches[0];
      const isDir = typeof dir[match] === "object";
      return [...parts, match + (isDir ? "/" : "")].join("/");
    } else if (matches.length > 1) {
      setOutput((o) => [...o, promptString(input), matches.join("  ")]);
    }
    return arg;
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex === history.length - 1 ? -1 : historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(newIndex === -1 ? "" : history[newIndex]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const parts = input.trim().split(" ");
      const base = parts[0];
      const arg = parts[1] || "";
      if (parts.length === 1) {
        const commands = ["ls", "ls -a", "cd", "cat", "pwd", "clear", "help", "echo"];
        const matches = commands.filter((c) => c.startsWith(base));
        if (matches.length === 1) setInput(matches[0] + " ");
        else if (matches.length > 1) setOutput((o) => [...o, promptString(input), matches.join("  ")]);
      } else if (parts.length === 2) {
        const completed = autocompletePath(arg);
        setInput(`${base} ${completed}`);
      }
    }
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "black", color: "#00ff00" }}>
      {/* Help toggle "?" fixed top-right */}
      {promptTop !== null && (
        <div
          onClick={() => setShowHelp(!showHelp)}
          style={{
            position: "fixed",
            top: `${promptTop}px`,
            right: "10px",
            cursor: "pointer",
            fontFamily: "'Ubuntu Mono', monospace",
            color: "#00ff00",
            fontSize: "22px",
            zIndex: 50
          }}
        >
          ?
        </div>
      )}

      {/* Help panel */}
      {showHelp && (
        <div
          style={{
            position: "fixed",
            top: promptTop + 30 + "px",
            right: "10px",
            backgroundColor: "rgba(0,0,0,0.9)",
            color: "#00ff00",
            padding: "8px",
            borderRadius: "4px",
            fontFamily: "'Ubuntu Mono', monospace",
            fontSize: "13px",
            width: "250px",
            zIndex: 50
          }}
        >
          <h2 style={{ fontWeight: "bold", marginBottom: "4px" }}>How to navigate</h2>
          <ul style={{ paddingLeft: "16px", margin: 0 }}>
            <li><b>ls</b> — list files</li>
            <li><b>ls -a</b> — list all</li>
            <li><b>cd &lt;dir&gt;</b> — enter folder</li>
            <li><b>cd ..</b> — go back</li>
            <li><b>cat &lt;file&gt;</b> — view file</li>
            <li><b>clear</b> — clear terminal</li>
            <li><b>help</b> — show commands</li>
            <li><b>[TAB]</b> — autocomplete</li>
            <li><b>↑↓</b> — history</li>
          </ul>

          <h2 style={{ fontWeight: "bold", marginTop: "8px", marginBottom: "4px" }}>Info</h2>
          <ul style={{ paddingLeft: "16px", margin: 0 }}>
            <li>files are shown in <span style={{ color: '#00ff00' }}>green</span>.</li>
            <li>folders are shown in <span style={{ color: '#3b82f6' }}>blue</span>.</li>
          </ul>

          <h3 style={{ fontWeight: "bold", marginTop: "8px", marginBottom: "4px" }}>Contact me</h3>
          <ul style={{ paddingLeft: "16px", margin: 0 }}>
            <li><b>echo from:NameOrEmail "Message" &gt; drinor.topalli@gmail.com</b> — send email</li>
          </ul>
        </div>
      )}

      {/* Terminal container */}
      <div className="max-w-3xl mx-auto p-4">
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
        <form onSubmit={handleSubmit} className="flex items-center" style={{ overflowX: 'auto' }}>
          <span
            ref={promptRef}
            dangerouslySetInnerHTML={{ __html: `${hostname}@portfolio:${getPromptPath()}$ ` }}
            style={{
              fontSize: "16px",
              fontFamily: "'Ubuntu Mono', monospace",
              color: "#00ff00",
              whiteSpace: 'pre'
            }}
          />
          <input
            ref={inputRef}
            type="text"
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
              whiteSpace: 'pre',
              flex: '0 0 auto',
              width: '1ch'
            }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {/* hidden mirror to measure text width */}
          <span
            ref={mirrorRef}
            aria-hidden="true"
            style={{
              position: 'absolute',
              visibility: 'hidden',
              whiteSpace: 'pre',
              fontSize: "16px",
              fontFamily: "'Ubuntu Mono', monospace",
              padding: 0,
              margin: 0,
            }}
          />
        </form>
      </div>
    </div>
  );
}
