'use client';

import { useState } from 'react';
import { useResearch } from '@/hooks/contexts/ResearchContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, Sparkles } from 'lucide-react';

const EXAMPLE_QUERIES = [
  "Tell me about traditional 'awa cultivation practices in Hawaii",
  "What did Hawaiian newspapers say about fishing rights in the 1920s?",
  "How was taro farming described in historical Hawaiian texts?",
  "What are the traditional uses of kukui nuts?",
];

export function ResearchQueryForm() {
  const [query, setQuery] = useState('');
  const { state, initiateResearch } = useResearch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = state.status === 'researching' || state.status === 'clarifying';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    setIsSubmitting(true);
    try {
      await initiateResearch(query);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExampleClick = (example: string) => {
    if (!isDisabled) {
      setQuery(example);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Start Your Research</CardTitle>
        </div>
        <CardDescription>
          Ask questions about Hawaiian history, culture, and traditional practices. Our AI
          agent will search through Papa Kilo Database and Hawaiian language newspapers.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to research? For example: 'What were traditional methods for preserving fish in ancient Hawaii?'"
              className="min-h-[120px] resize-none"
              disabled={isDisabled}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{query.length} characters</span>
              {query.length > 500 && (
                <span className="text-yellow-600">
                  Longer queries may take more time to research
                </span>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={!query.trim() || isDisabled || isSubmitting}
            className="w-full"
            size="lg"
          >
            <Search className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Starting Research...' : 'Start Research'}
          </Button>
        </form>

        {/* Example Queries */}
        {state.status === 'idle' && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Try an example:</p>
            <div className="grid gap-2">
              {EXAMPLE_QUERIES.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleExampleClick(example)}
                  className="text-left text-sm p-2 rounded-md border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
