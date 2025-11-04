import React, { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/firebase";

function getDrivePreviewLink(link: string) {
  try {
    const idMatch = link.match(/[?&]id=([^&]+)/);
    if (idMatch && idMatch[1]) return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
    const fileMatch = link.match(/\/file\/d\/([^\/]+)/);
    if (fileMatch && fileMatch[1]) return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
    if (link.includes("export=download")) return link.replace("export=download", "export=view");
    return link;
  } catch {
    return link;
  }
}

export default function UploadBookByLink() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [categories, setCategories] = useState("");
  const [lang, setLang] = useState("Unknown");
  const [desc, setDesc] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !link) {
      alert("Provide at least title and link.");
      return;
    }
    setLoading(true);
    try {
      const preview = getDrivePreviewLink(link.trim());
      await addDoc(collection(db, "books"), {
        title: title.trim(),
        authors: authors ? authors.split(",").map((s) => s.trim()) : [],
        categories: categories ? categories.split(",").map((s) => s.trim()) : [],
        language: lang,
        description: desc,
        driveLink: preview,
        fileType: "pdf",
        dateAdded: serverTimestamp(),
      });
      alert("Book added.");
      navigate("/admin/library");
    } catch (err) {
      console.error(err);
      alert("Failed to add book: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="mb-4 text-lg font-bold">Add book (paste Drive link)</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input required placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded" />
        <input placeholder="Authors (comma separated)" value={authors} onChange={(e) => setAuthors(e.target.value)} className="w-full p-2 border rounded" />
        <input placeholder="Categories (comma separated)" value={categories} onChange={(e) => setCategories(e.target.value)} className="w-full p-2 border rounded" />
        <input placeholder="Language" value={lang} onChange={(e) => setLang(e.target.value)} className="w-full p-2 border rounded" />
        <textarea placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-2 border rounded" />
        <input required placeholder="Google Drive or direct PDF link" value={link} onChange={(e) => setLink(e.target.value)} className="w-full p-2 border rounded" />
        <div>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded">
            {loading ? "Adding..." : "Add Book"}
          </button>
        </div>
      </form>
      <p className="mt-3 text-sm text-muted-foreground">
        Note: make sure the Drive file is shared as "Anyone with the link can view".
      </p>
    </div>
  );
}