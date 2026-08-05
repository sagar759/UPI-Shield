"use client";

import * as React from "react";
import { Select } from "@/components/ui/select";
import { TextArea } from "@/components/ui/text-area";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorSummary } from "@/components/ui/error-summary";
import { MessageConsent } from "@/components/analyze/message/message-consent";
import {
  MessageExamples,
  SyntheticExample,
} from "@/components/analyze/message/message-examples";
import {
  MessageFormDraft,
  MessageChannel,
  MESSAGE_CHANNEL_OPTIONS,
  createInitialMessageFormDraft,
  validateMessageFormDraft,
  buildMessageAnalysisInput,
  MessageAnalysisInput,
  MessageFormErrors,
} from "@/lib/forms/message-form-state";
import { MAX_MESSAGE_LENGTH } from "@/lib/contracts/primitives";
import { MessageSquare, Trash2, Send, ShieldCheck, Sparkles } from "lucide-react";

export interface MessageFormProps {
  initialDraft?: Partial<MessageFormDraft>;
  onDraftChange?: (draft: MessageFormDraft) => void;
  onAnalysisSubmit?: (input: MessageAnalysisInput) => void;
  mode?: "standalone" | "embedded";
  disabled?: boolean;
}

export function MessageForm({
  initialDraft,
  onDraftChange,
  onAnalysisSubmit,
  mode = "standalone",
  disabled = false,
}: MessageFormProps) {
  const [draft, setDraft] = React.useState<MessageFormDraft>(() =>
    createInitialMessageFormDraft(initialDraft)
  );

  const [touched, setTouched] = React.useState(false);
  const [activeExampleId, setActiveExampleId] = React.useState<string | undefined>(
    undefined
  );

  // Sync draft state with external controller if provided
  const updateDraft = React.useCallback(
    (updates: Partial<MessageFormDraft>) => {
      const next = { ...draft, ...updates };
      setDraft(next);

      if (onDraftChange) {
        onDraftChange(next);
      }

      // If user edits text manually after picking an example, clear the active example highlight
      if ("messageText" in updates && updates.messageText !== undefined) {
        if (activeExampleId) {
          setActiveExampleId(undefined);
        }
      }
    },
    [draft, onDraftChange, activeExampleId]
  );

  // Recalculate validation errors when touched
  const errors: MessageFormErrors = React.useMemo(() => {
    if (!touched) return {};
    return validateMessageFormDraft(draft).errors;
  }, [draft, touched]);

  const handleChannelChange = (val: string) => {
    updateDraft({ channel: val as MessageChannel });
  };

  const handleMessageTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    updateDraft({
      messageText: text,
      // If user types custom text, reset synthetic demo content flag
      isDemoContent: false,
    });
  };

  const handleSelectExample = (example: SyntheticExample) => {
    updateDraft({
      messageText: example.text,
      channel: example.channel,
      isDemoContent: true,
      // Auto-grant analysis consent when intentionally selecting a safe demo fixture
      consentGiven: true,
    });
    setActiveExampleId(example.id);
  };

  const handleClearDraft = () => {
    const reset = createInitialMessageFormDraft();
    setDraft(reset);
    setActiveExampleId(undefined);
    setTouched(false);
    if (onDraftChange) {
      onDraftChange(reset);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTouched(true);

    const validation = validateMessageFormDraft(draft);

    if (!validation.isValid) {
      return;
    }

    const { input } = buildMessageAnalysisInput(draft);
    if (input) {
      if (onAnalysisSubmit) {
        onAnalysisSubmit(input);
        // Clear sensitive draft text on successful workflow completion
        handleClearDraft();
      }
    }
  };

  const errorSummaryItems = React.useMemo(() => {
    return Object.entries(errors).map(([fieldKey, message]) => ({
      fieldId:
        fieldKey === "messageText"
          ? "message-text-input"
          : fieldKey === "consentGiven"
          ? "message-analysis-consent"
          : "message-channel-select",
      message,
    }));
  }, [errors]);

  const charCount = draft.messageText.length;
  const isOverLength = charCount > MAX_MESSAGE_LENGTH;
  const FormContainer = mode === "embedded" ? "div" : "form";

  return (
    <FormContainer
      {...(mode === "standalone" ? { onSubmit: handleSubmit, noValidate: true } : {})}
      className="space-y-6 w-full max-w-2xl mx-auto"
      aria-labelledby={mode === "standalone" ? "message-form-title" : undefined}
    >
      {/* Error Summary Banner when touched and errors exist */}
      {touched && errorSummaryItems.length > 0 && (
        <ErrorSummary
          title="Message Input Validation Issues"
          errors={errorSummaryItems}
        />
      )}

      {/* Header for Standalone Mode */}
      {mode === "standalone" && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare
              className="w-5 h-5 text-[var(--accent-primary,#1565c0)]"
              aria-hidden="true"
            />
            <h2
              id="message-form-title"
              className="text-lg font-bold text-[var(--text-primary,#172033)]"
            >
              Scam Message & Chat Inspector
            </h2>
            {draft.isDemoContent && (
              <StatusBadge
                variant="neutral"
                label="Demo Content"
                icon={<Sparkles className="w-3 h-3 text-amber-500" aria-hidden="true" />}
              />
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary,#475569)]">
            Select the message channel and paste suspicious text to inspect language tactics without executing transactions.
          </p>
        </div>
      )}

      {/* Synthetic Example Catalog Selector */}
      <MessageExamples
        onSelectExample={handleSelectExample}
        activeExampleId={activeExampleId}
        disabled={disabled}
      />

      {/* Channel / Source Selection */}
      <div className="space-y-1.5">
        <Select
          id="message-channel-select"
          label="Message Source / Channel"
          value={draft.channel}
          onChange={(e) => handleChannelChange(e.target.value)}
          error={touched ? errors.channel : undefined}
          disabled={disabled}
          options={MESSAGE_CHANNEL_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          description="Identify where the message originated (SMS, WhatsApp, Telegram, Call, Social)."
        />
      </div>

      {/* Multiline Message Text Area with Live Character Count */}
      <div className="space-y-1.5 relative">
        <TextArea
          id="message-text-input"
          label="Scam Message Text or Transcript"
          placeholder="Paste SMS, WhatsApp message, Telegram request, social DM, or phone call transcript here..."
          value={draft.messageText}
          onChange={handleMessageTextChange}
          error={touched ? errors.messageText : undefined}
          disabled={disabled}
          rows={6}
          aria-describedby="message-char-count message-privacy-note"
        />

        <div className="flex items-center justify-between text-xs pt-1 px-1">
          <span
            id="message-privacy-note"
            className="text-[var(--text-tertiary,#64748b)] flex items-center gap-1 text-[11px]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            Local session analysis • Safe Unicode supported
          </span>
          <span
            id="message-char-count"
            className={`font-mono text-xs ${
              isOverLength
                ? "text-[var(--status-danger-text,#b91c1c)] font-semibold"
                : "text-[var(--text-tertiary,#64748b)]"
            }`}
          >
            {charCount.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}{" "}
            chars
          </span>
        </div>
      </div>

      {/* Consent Controls & Privacy Warnings */}
      <MessageConsent
        consentGiven={draft.consentGiven}
        onConsentGivenChange={(checked) => updateDraft({ consentGiven: checked })}
        consentGivenError={touched ? errors.consentGiven : undefined}
        retentionConsent={draft.retentionConsent}
        onRetentionConsentChange={(checked) =>
          updateDraft({ retentionConsent: checked })
        }
        disabled={disabled}
      />

      {/* Form Action Controls */}
      <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2"
          onClick={handleClearDraft}
          disabled={disabled || (draft.messageText.length === 0 && !draft.consentGiven)}
        >
          <Trash2 className="w-4 h-4 text-slate-500" aria-hidden="true" />
          Clear Text
        </Button>

        <Button
          type={mode === "embedded" ? "button" : "submit"}
          variant="primary"
          className="w-full sm:flex-1 min-h-[44px] flex items-center justify-center gap-2"
          disabled={disabled}
          onClick={mode === "embedded" ? () => handleSubmit() : undefined}
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          {mode === "embedded" ? "Include Message in Risk Check" : "Analyze Scam Message"}
        </Button>
      </div>
    </FormContainer>
  );
}
