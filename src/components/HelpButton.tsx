export function HelpButton() {
  return (
    <button
      className="help-trigger"
      onClick={() => window.dispatchEvent(new Event("retroforge:help"))}
    >
      Help
    </button>
  );
}
