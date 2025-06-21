'use client';

import { useState, useRef, useTransition } from 'react';
import { Upload, FileText, BrainCircuit, Loader2, Wand2 } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateFlashcards, type GenerateFlashcardsOutput } from '@/ai/flows/generate-flashcards';
import { Flashcard } from './flashcard';

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
    setIsGenerating(true);
    startProcessing(async () => {
      try {
        const result = await generateFlashcards({ text: extractedText });
        if (result && result.flashcards) {
          setFlashcards(result.flashcards);
          toast({ title: 'Success!', description: result.progress || 'Flashcards generated successfully.' });
        } else {
            throw new Error("Invalid response from AI.")
        }
      } catch (error) {
        console.error('Error generating flashcards:', error);
        toast({ title: 'Generation Failed', description: 'Could not generate flashcards. Please try again.', variant: 'destructive' });
      } finally {
        setIsGenerating(false);
      }
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Card className="w-full max-w-2xl mx-auto shadow-lg animate-in fade-in-0 zoom-in-95">
        <CardHeader className="text-center p-8">
          <div className="mx-auto bg-primary/10 text-primary rounded-full p-3 w-fit mb-4">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <CardTitle className="font-headline text-3xl md:text-4xl">Flashcard Generator</CardTitle>
          <CardDescription className="font-body text-base mt-2">
            Upload a PDF to instantly create a set of study flashcards with AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">
          <div className="space-y-4">
            <Input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={isProcessing} />
            <Button onClick={handleUploadClick} className="w-full" variant="outline" size="lg" disabled={isProcessing}>
              <Upload className="mr-2 h-5 w-5" />
              {fileName ? 'Upload Another PDF' : 'Upload PDF'}
            </Button>
            {isProcessing && !isGenerating && (
              <div className="flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Extracting text...</div>
            )}
            {fileName && !isProcessing && (
              <div className="text-center text-sm text-muted-foreground flex items-center justify-center">
                <FileText className="mr-2 h-4 w-4" />
                <span>{fileName}</span>
              </div>
            )}
          </div>
          
          {extractedText && (
            <Button onClick={handleGenerateFlashcards} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" size="lg" disabled={isProcessing}>
              {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
              {isGenerating ? 'Generating...' : 'Generate Flashcards'}
            </Button>
          )}

        </CardContent>
      </Card>

      {flashcards.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl md:text-3xl font-headline text-center mb-8">Your Flashcards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {flashcards.map((card, index) => (
              <Flashcard key={index} question={card.question} answer={card.answer} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
