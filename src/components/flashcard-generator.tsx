
'use client';

import { useState, useRef, useTransition } from 'react';
import { Upload, FileText, BrainCircuit, Loader2, Wand2, TestTube2, Sparkles, Download } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateFlashcards, type GenerateFlashcardsOutput } from '@/ai/flows/generate-flashcards';
import { Flashcard } from './flashcard';
import { QuizMode } from './quiz-mode';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Leaderboard } from './leaderboard';
import { ThemeToggle } from './theme-toggle';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

type FlashcardType = GenerateFlashcardsOutput['flashcards'][0];

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument(arrayBuffer).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
    fullText += pageText + ' ';
  }
  return fullText.trim();
}

export function FlashcardGenerator() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [isProcessing, startProcessing] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isVisualMode, setIsVisualMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({ title: 'Invalid File Type', description: 'Please upload a PDF file.', variant: 'destructive' });
      return;
    }

    setFileName(file.name);
    setFlashcards([]);
    setExtractedText(null);
    setIsQuizMode(false);

    startProcessing(async () => {
      try {
        const text = await extractTextFromPdf(file);
        setExtractedText(text);
        toast({ title: 'Text Extracted', description: 'Successfully extracted text from your PDF.' });
      } catch (error) {
        console.error('Error extracting text:', error);
        toast({ title: 'Extraction Failed', description: 'Could not extract text from the PDF.', variant: 'destructive' });
        setFileName(null);
      }
    });
  };

  const handleGenerateFlashcards = () => {
    if (!extractedText) {
       toast({ title: 'No text available', description: 'Please upload a PDF first to extract text.', variant: 'destructive' });
      return;
    }

    setFlashcards([]);
    setIsQuizMode(false);
    setIsGenerating(true);
    startProcessing(async () => {
      try {
        const result = await generateFlashcards({ text: extractedText, language: selectedLanguage });
        if (result && result.flashcards) {
          setFlashcards(result.flashcards);
          toast({ title: 'Success!', description: result.progress || 'Flashcards generated successfully.' });
        } else {
            throw new Error("Invalid response from AI.")
        }
      } catch (error) {
        console.error('Error generating flashcards:', error);
        toast({ title: 'Generation Failed', description: 'The AI returned an invalid response. Please try again.', variant: 'destructive' });
      } finally {
        setIsGenerating(false);
      }
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleExportCsv = () => {
    if (flashcards.length === 0) {
      toast({ title: 'No flashcards to export', variant: 'destructive' });
      return;
    }
    const headers = ['"Question"', '"Answer"'];
    const rows = flashcards.map(card => `"${card.question.replace(/"/g, '""')}", "${card.answer.replace(/"/g, '""')}"`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "flashcards.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Exported as CSV' });
  };

  const handleExportPdf = () => {
    if (flashcards.length === 0) {
      toast({ title: 'No flashcards to export', variant: 'destructive' });
      return;
    }
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Flashcards", 105, 20, { align: 'center' });

    (doc as any).autoTable({
        head: [['Question', 'Answer']],
        body: flashcards.map(card => [card.question, card.answer]),
        startY: 30,
        headStyles: {
            fillColor: [69, 143, 246],
        },
    });

    doc.save('flashcards.pdf');
    toast({ title: 'Exported as PDF' });
  };

  const renderContent = () => {
    if (isQuizMode) {
      const quizFlashcards = [...flashcards]
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);
      return <QuizMode flashcards={quizFlashcards} onExitQuiz={() => setIsQuizMode(false)} />;
    }

    if (flashcards.length > 0) {
      return (
        <div className="mt-12">
          <h2 className="text-2xl md:text-3xl font-headline text-center mb-8 uppercase tracking-widest">Your Flashcards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {flashcards.map((card, index) => (
              <Flashcard 
                key={index} 
                question={card.question} 
                answer={card.answer} 
                emoji={card.emoji}
                isVisualMode={isVisualMode}
                index={index} 
              />
            ))}
          </div>
          <div className="text-center mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={() => setIsQuizMode(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground glow-on-hover" size="lg">
                <TestTube2 className="mr-2 h-5 w-5" />
                Start Quiz
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="glow-on-hover">
                  <Download className="mr-2 h-5 w-5" />
                  Export Flashcards
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportCsv}>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPdf}>Export as PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 relative">
       <div className="absolute top-4 right-4 z-10 sm:top-8 sm:right-8">
        <ThemeToggle />
      </div>

      {!isQuizMode && (
        <Card className="w-full max-w-2xl mx-auto shadow-2xl shadow-accent/30 animate-in fade-in-0 zoom-in-95">
          <CardHeader className="text-center p-8">
            <div className="mx-auto bg-accent/20 text-accent rounded-full p-3 w-fit mb-4">
              <BrainCircuit className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline text-3xl md:text-4xl tracking-widest uppercase">FlashMind</CardTitle>
            <CardDescription className="font-body text-base mt-2">
              Upload a data file (PDF) and our AI will synthesize knowledge implants (flashcards).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div className="space-y-4">
              <Input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={isProcessing} />
              <Button onClick={handleUploadClick} className="w-full glow-on-hover" variant="outline" size="lg" disabled={isProcessing}>
                <Upload className="mr-2 h-5 w-5" />
                {fileName ? 'Upload Another PDF' : 'Upload PDF'}
              </Button>
              {isProcessing && !isGenerating && (
                <div className="flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin text-accent text-glow-accent" />Extracting text...</div>
              )}
              {fileName && !isProcessing && (
                <div className="text-center text-sm text-muted-foreground flex items-center justify-center">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{fileName}</span>
                </div>
              )}
            </div>
            
            {extractedText && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="language-select" className="text-muted-foreground text-sm">Translate to</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isProcessing}>
                      <SelectTrigger id="language-select" className="w-full">
                          <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Hindi">Hindi</SelectItem>
                          <SelectItem value="Kannada">Kannada</SelectItem>
                          <SelectItem value="Tamil">Tamil</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="visual-mode" className="flex items-center gap-2 text-base font-body text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Visual Mode
                  </Label>
                  <Switch
                    id="visual-mode"
                    checked={isVisualMode}
                    onCheckedChange={setIsVisualMode}
                    disabled={isProcessing}
                  />
                </div>
                <Button onClick={handleGenerateFlashcards} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground glow-accent" size="lg" disabled={isProcessing}>
                  {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                  {isGenerating ? 'Generating...' : 'Generate Flashcards'}
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {renderContent()}

      {!isQuizMode && flashcards.length === 0 && <Leaderboard />}
    </div>
  );
}
