import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, deleteDoc, doc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Upload, Trash2, BookOpen } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Book } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();

  // simplified: upload only by Drive link
  const [driveLink, setDriveLink] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [language, setLanguage] = useState("");
  const [categories, setCategories] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["admin-books"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "books"));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Book));
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "books", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast({
        title: "Book Deleted",
        description: "The book has been removed from the library.",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      // always expect a Drive link (we removed file-upload path)
      if (!driveLink) throw new Error("Provide a Google Drive link.");
      const idMatch = driveLink.match(/[?&]id=([^&]+)/);
      const fileMatch = driveLink.match(/\/file\/d\/([^\/]+)/);
      const fileId = idMatch?.[1] || fileMatch?.[1];
      const preview = fileId
        ? `https://drive.google.com/file/d/${fileId}/preview`
        : driveLink.replace("export=download", "export=view");

      const bookData: Omit<Book, "id"> = {
        title,
        authors: authors ? authors.split(",").map((a) => a.trim()) : [],
        language,
        categories: categories ? categories.split(",").map((c) => c.trim()) : [],
        description,
        driveLink: preview,
        fileType: "pdf",
        uploadedBy: user.uid,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "books"), bookData);

      queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });

      toast({
        title: "Book Added!",
        description: "The book has been added to the library.",
      });

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error?.message || String(error),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setAuthors("");
    setLanguage("");
    setCategories("");
    setDescription("");
    setDriveLink("");
  };

  return (
    <AdminLayout>
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <section className="bg-secondary text-secondary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading font-bold text-4xl mb-3">Manage Library</h1>
              <p className="text-lg opacity-90">Upload and manage spiritual literature</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" data-testid="button-add-book">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-heading">Upload New Book</DialogTitle>
                  <DialogDescription>Add a new book to the spiritual library</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      data-testid="input-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authors">Authors (comma-separated) *</Label>
                    <Input
                      id="authors"
                      placeholder="e.g., Srila Prabhupada, Bhaktivedanta Swami"
                      value={authors}
                      onChange={(e) => setAuthors(e.target.value)}
                      required
                      data-testid="input-authors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language *</Label>
                      <Select value={language} onValueChange={setLanguage} required>
                        <SelectTrigger data-testid="select-language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Nepali">Nepali</SelectItem>
                          <SelectItem value="Hindi">Hindi</SelectItem>
                          <SelectItem value="Sanskrit">Sanskrit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categories">Categories (comma-separated) *</Label>
                      <Input
                        id="categories"
                        placeholder="e.g., Bhagavad Gita, Philosophy"
                        value={categories}
                        onChange={(e) => setCategories(e.target.value)}
                        required
                        data-testid="input-categories"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={3}
                      data-testid="input-description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="driveLink">Google Drive Link *</Label>
                    <Input
                      id="driveLink"
                      type="url"
                      placeholder="https://drive.google.com..."
                      value={driveLink}
                      onChange={(e) => setDriveLink(e.target.value)}
                      required
                      data-testid="input-drive-link"
                    />
                    <p className="text-sm text-muted-foreground">
                      Make sure file is shared "Anyone with the link can view". Prefer the preview link or share link.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={uploading}
                    data-testid="button-submit"
                  >
                    {uploading ? (
                      <>
                        <Upload className="mr-2 h-4 w-4 animate-pulse" />
                        Uploading...
                      </>
                    ) : (
                      "Upload Book"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : books.length === 0 ? (
          <Card className="p-16 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading font-semibold text-xl mb-2">No Books in Library</h3>
            <p className="text-muted-foreground mb-6">Upload your first book to get started</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <Card key={book.id} data-testid={`book-card-${book.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="secondary">{book.language}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBookMutation.mutate(book.id)}
                      data-testid={`button-delete-${book.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <CardTitle className="font-heading line-clamp-2">{book.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    by {book.authors.join(", ")}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {book.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {book.categories.slice(0, 3).map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <div className="fixed bottom-4 right-4">
        <Link to="/admin/upload-link" className="btn">
          Add book by Drive link
        </Link>
      </div>
    </div>
    </AdminLayout>
  );
}
