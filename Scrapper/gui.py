import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import threading
import sys
import os
from pathlib import Path

# Import scraper logic
try:
    from scraper import scrape, save_json, save_csv
except ImportError:
    # If run from root, handle path
    sys.path.append(str(Path(__file__).parent))
    from scraper import scrape, save_json, save_csv

class ScraperGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Hidden Deals — Property Scraper v1.0")
        self.root.geometry("600x500")
        self.root.configure(bg="#0f172a")  # Slate 900
        
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        # Configure Colors
        self.bg_color = "#0f172a"
        self.card_color = "#1e293b"
        self.accent_color = "#6366f1" # Indigo 500
        self.text_color = "#f1f5f9"
        
        self.setup_ui()
        
    def setup_ui(self):
        # Header
        header = tk.Frame(self.root, bg=self.accent_color, height=60)
        header.pack(fill="x")
        tk.Label(header, text="🏠 Hidden Deals Scraper", bg=self.accent_color, fg="white", 
                 font=("Inter", 16, "bold"), pady=15).pack()
        
        # Main Container
        main_frame = tk.Frame(self.root, bg=self.bg_color, padx=30, pady=20)
        main_frame.pack(fill="both", expand=True)
        
        # Configuration Card
        config_frame = tk.LabelFrame(main_frame, text=" Scraping Configuration ", bg=self.bg_color, fg=self.accent_color,
                                    font=("Inter", 10, "bold"), padx=20, pady=20, borderwidth=1, relief="flat")
        config_frame.pack(fill="x", pady=10)
        
        # Page Selection
        row1 = tk.Frame(config_frame, bg=self.bg_color)
        row1.pack(fill="x", pady=5)
        
        tk.Label(row1, text="Number of pages to scrape:", bg=self.bg_color, fg=self.text_color, font=("Inter", 10)).pack(side="left")
        
        self.pages_var = tk.StringVar(value="1")
        self.pages_entry = tk.Entry(row1, textvariable=self.pages_var, width=5, bg=self.card_color, 
                                   fg="white", insertbackground="white", borderwidth=0, font=("Inter", 10))
        self.pages_entry.pack(side="left", padx=10)
        
        self.all_pages_var = tk.BooleanVar(value=False)
        self.all_pages_cb = tk.Checkbutton(row1, text="Scrape ALL pages", variable=self.all_pages_var, 
                                          bg=self.bg_color, fg=self.accent_color, selectcolor=self.card_color,
                                          activebackground=self.bg_color, activeforeground=self.accent_color,
                                          font=("Inter", 9, "italic"), command=self.toggle_pages_entry)
        self.all_pages_cb.pack(side="left", padx=20)
        
        # Format Selection
        row2 = tk.Frame(config_frame, bg=self.bg_color)
        row2.pack(fill="x", pady=15)
        
        tk.Label(row2, text="Export Format:", bg=self.bg_color, fg=self.text_color, font=("Inter", 10)).pack(side="left")
        
        self.format_var = tk.StringVar(value="json")
        tk.Radiobutton(row2, text="JSON", variable=self.format_var, value="json", bg=self.bg_color, fg=self.text_color,
                      selectcolor=self.accent_color, activebackground=self.bg_color).pack(side="left", padx=10)
        tk.Radiobutton(row2, text="CSV", variable=self.format_var, value="csv", bg=self.bg_color, fg=self.text_color,
                      selectcolor=self.accent_color, activebackground=self.bg_color).pack(side="left", padx=10)
        
        # Action Button
        self.run_btn = tk.Button(main_frame, text="START SCRAPING", command=self.start_scraping, 
                               bg=self.accent_color, fg="white", font=("Inter", 11, "bold"), 
                               padx=30, pady=10, borderwidth=0, cursor="hand2", activebackground="#4f46e5")
        self.run_btn.pack(pady=10)
        
        # Progress Log
        tk.Label(main_frame, text="Activity Log", bg=self.bg_color, fg="#64748b", font=("Inter", 9, "bold")).pack(anchor="w")
        self.log_text = tk.Text(main_frame, height=8, bg=self.card_color, fg="#94a3b8", font=("JetBrains Mono", 9), 
                               padx=10, pady=10, borderwidth=0)
        self.log_text.pack(fill="both", expand=True, pady=5)
        
        # Status Bar
        self.status_var = tk.StringVar(value="Ready")
        status_bar = tk.Label(self.root, textvariable=self.status_var, bg=self.card_color, fg="#64748b", 
                             font=("Inter", 8), anchor="w", padx=10, pady=5)
        status_bar.pack(side="bottom", fill="x")

    def toggle_pages_entry(self):
        if self.all_pages_var.get():
            self.pages_entry.config(state="disabled")
        else:
            self.pages_entry.config(state="normal")

    def log(self, message):
        self.log_text.insert("end", f"> {message}\n")
        self.log_text.see("end")

    def start_scraping(self):
        max_pages = None if self.all_pages_var.get() else int(self.pages_var.get() or 1)
        output_format = self.format_var.get()
        
        filename = filedialog.asksaveasfilename(
            defaultextension=f".{output_format}",
            filetypes=[(f"{output_format.upper()} files", f"*.{output_format}"), ("All files", "*.*")],
            initialfile=f"listings.{output_format}"
        )
        
        if not filename:
            return
            
        self.run_btn.config(state="disabled", text="RUNNING...")
        self.status_var.set("Scraping in progress...")
        self.log_text.delete("1.0", "end")
        
        # Run in thread to keep GUI responsive
        threading.Thread(target=self.run_scraper, args=(max_pages, filename, output_format), daemon=True).start()

    def run_scraper(self, max_pages, output_path, output_format):
        try:
            self.log(f"Starting scraper (Pages: {'All' if max_pages is None else max_pages})")
            
            results = []
            for property_item in scrape(max_pages):
                results.append(property_item)
                if len(results) % 5 == 0:
                    self.log(f"Found {len(results)} listings...")
            
            self.log(f"Scraping complete. Total: {len(results)} listings.")
            
            if output_format == "csv":
                save_csv(results, output_path)
            else:
                save_json(results, output_path)
                
            self.log(f"Data saved to: {os.path.basename(output_path)}")
            messagebox.showinfo("Success", f"Successfully scraped {len(results)} listings and saved to {output_path}")
            
        except Exception as e:
            self.log(f"ERROR: {str(e)}")
            messagebox.showerror("Scraping Error", str(e))
        finally:
            self.run_btn.config(state="normal", text="START SCRAPING")
            self.status_var.set("Ready")

if __name__ == "__main__":
    root = tk.Tk()
    app = ScraperGUI(root)
    root.mainloop()
