

## Plan: Add V1/V2 version toggle to Add Contract modal with AI-powered file extraction

### Overview
Add a dropdown (V1/V2) in the top-right corner of the Add Contract modal. V1 is the current manual form. V2 starts with a file upload step — user uploads a contract document (PDF), AI extracts contract data and pre-fills the form. Each AI-filled field gets a "AI suggested" label (sparkle icon + badge), following the pattern from the Asset Mapping project.

### Changes

#### 1. New edge function: `supabase/functions/analyze-contract/index.ts`
- Accepts a base64-encoded file (PDF) via POST
- Calls Lovable AI Gateway (`google/gemini-2.5-flash`) with the document
- Uses tool calling to extract structured data: `contract_number`, `contract_date`, `amount`, `currency`, `contractor`, `description`, `status`, `comments`
- Each field returns `{ value, confidence }` (high/medium/low)
- Returns JSON with extracted fields

#### 2. `src/components/project-detail/ContractsTab.tsx`
- Add `version` state (`"V1" | "V2"`, default `"V1"`)
- In `DialogHeader`, add a small Select dropdown (top-right) to switch between V1 and V2
- **V1 mode**: current form, unchanged
- **V2 mode**:
  - **Step 1 (upload)**: Show a file upload area (drag & drop or click). Accept PDF files. On upload, read file as base64, call `analyze-contract` edge function, show loading spinner
  - **Step 2 (review)**: Show the same form as V1, but pre-filled with AI-extracted values. Add `extractedData` state holding the AI response. Each field that was AI-filled gets an `AiLabel` component next to the Label (sparkle icon + "AI suggestion" text + confidence badge in color)
  - User can edit any field, then save as usual
- Add `AiLabel` component inline (same pattern as Asset Mapping): sparkle icon, "AI suggestion" text, confidence badge colored by level
- AI-filled input fields get a subtle highlight (`border-primary/30 bg-blue-50`)
- Reset `extractedData` and `version` on modal close

#### 3. No database changes needed
The contract table already has all required columns.

### Technical details

**AiLabel component** (inline in ContractsTab):
```tsx
const AiLabel = ({ field }) => {
  if (!field) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex items-center gap-1 text-[10px] font-medium text-primary">
        <Sparkles className="h-3 w-3" /> AI suggestion
      </span>
      <Badge variant="outline" className={confidenceColor(field.confidence)}>
        {confidence label}
      </Badge>
    </div>
  );
};
```

**Edge function** uses the same pattern as `analyze-equipment` from Asset Mapping — tool calling with structured extraction, Lovable AI Gateway, `LOVABLE_API_KEY`.

**File upload** reads the file as base64 using `FileReader`, sends to edge function via `supabase.functions.invoke("analyze-contract", { body: { fileBase64, fileName } })`.

### Files to create/edit
- **Create**: `supabase/functions/analyze-contract/index.ts`
- **Edit**: `src/components/project-detail/ContractsTab.tsx`

