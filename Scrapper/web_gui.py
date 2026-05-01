from flask import Flask, render_template, request, Response, send_from_directory
import json
import os
import time
from scraper import scrape, save_json, save_csv

app = Flask(__name__)

# Route to serve the HTML file
@app.route('/')
def index():
    # Since scraper-ui.html is in the same directory, we can serve it directly
    with open('scraper-ui.html', 'r') as f:
        return f.read()

@app.route('/api/scrape/stream')
def scrape_stream():
    pages_param = request.args.get('pages', '1')
    format_param = request.args.get('format', 'json')
    
    max_pages = None if pages_param == 'all' else int(pages_param)
    
    def generate():
        results = []
        try:
            yield f"data: {json.dumps({'type': 'log', 'message': f'Starting scraper for {pages_param} pages...'})}\n\n"
            
            for property_item in scrape(max_pages):
                results.append(property_item)
                if len(results) % 5 == 0:
                    yield f"data: {json.dumps({'type': 'log', 'message': f'Found {len(results)} listings...'})}\n\n"
            
            yield f"data: {json.dumps({'type': 'log', 'message': f'Scraping complete. Total: {len(results)} listings.'})}\n\n"
            
            # Save the file
            filename = f"listings.{format_param}"
            if format_param == 'csv':
                save_csv(results, filename)
            else:
                save_json(results, filename)
                
            yield f"data: {json.dumps({'type': 'done', 'file': filename})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/download/<filename>')
def download_file(filename):
    return send_from_directory(os.getcwd(), filename, as_attachment=True)

if __name__ == '__main__':
    print("\n🕸️  Scraper Web UI starting...")
    print("➜  Local:   http://localhost:5001")
    print("➜  Network: http://0.0.0.0:5001 (accessible via your IP)")
    app.run(host='0.0.0.0', port=5001, debug=True)
