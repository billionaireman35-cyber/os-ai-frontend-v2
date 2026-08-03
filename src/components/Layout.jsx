export default function Layout({ children }) {
  // This layout is used by some pages; we remove the sidebar to avoid duplication.
  // The main sidebar is provided by Shell in App.jsx.
  return (
    <div className="flex-1 flex flex-col">
      {children}
    </div>
  );
}
