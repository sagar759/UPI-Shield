"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalyzerModeControl } from "@/components/analyze/analyzer-mode-control";
import {
  AnalyzerResultRegion,
  type ResultState,
} from "@/components/analyze/analyzer-result-region";
import { Panel } from "@/components/ui/panel";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "@/components/analyze/transaction/transaction-form";
import { type TransactionFormDraft } from "@/lib/forms/transaction-form-state";
import { MessageForm } from "@/components/analyze/message/message-form";
import { type MessageFormDraft } from "@/lib/forms/message-form-state";
import {
  parseAnalyzeSearchParams,
  buildAnalyzeSearchUrl,
  type AnalyzerMode,
  type ParsedAnalyzeSearchState,
} from "@/lib/navigation/analyze-search-state";

export interface TransactionDraft {
  amount: string;
  recipientVpa: string;
  note: string;
  contactId?: string;
}

export interface MessageDraft {
  rawMessage: string;
  sender: string;
}

export interface ReceiverDraft {
  receiverVpa: string;
  timeWindow: string;
}

export interface FormSlotProps<T> {
  draft: T;
  onChange: (updates: Partial<T>) => void;
  onSubmit: () => void;
}

export interface AnalyzerWorkspaceProps {
  initialState?: ParsedAnalyzeSearchState;
  renderTransactionForm?: (props: FormSlotProps<TransactionDraft>) => React.ReactNode;
  renderMessageForm?: (props: FormSlotProps<MessageDraft>) => React.ReactNode;
  renderReceiverForm?: (props: FormSlotProps<ReceiverDraft>) => React.ReactNode;
  renderResultRegion?: (props: { mode: AnalyzerMode; state: ResultState }) => React.ReactNode;
}

export function AnalyzerWorkspace({
  initialState,
  renderTransactionForm,
  renderMessageForm,
  renderReceiverForm,
  renderResultRegion,
}: AnalyzerWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL search parameters safely
  const currentSearchState = React.useMemo(() => {
    if (searchParams && searchParams.size > 0) {
      return parseAnalyzeSearchParams(searchParams);
    }
    return initialState || parseAnalyzeSearchParams(null);
  }, [searchParams, initialState]);

  const [activeMode, setActiveMode] = React.useState<AnalyzerMode>(
    currentSearchState.mode
  );
  const [resultState, setResultState] = React.useState<ResultState>("idle");

  // Ref for accessibility focus management on mode switch
  const inputHeadingRef = React.useRef<HTMLHeadingElement>(null);

  // Independent in-memory draft states per mode
  const [transactionDraft, setTransactionDraft] = React.useState<TransactionDraft>(
    () => ({
      amount: "",
      recipientVpa:
        currentSearchState.resolvedContact?.vpa ||
        currentSearchState.resolvedContact?.displayName ||
        "",
      note: "",
      contactId: currentSearchState.contactId,
    })
  );

  const [messageDraft, setMessageDraft] = React.useState<MessageDraft>({
    rawMessage: "",
    sender: "",
  });

  const [receiverDraft, setReceiverDraft] = React.useState<ReceiverDraft>({
    receiverVpa: "",
    timeWindow: "24h",
  });

  // Adjust activeMode state during render when URL search mode changes
  const [prevMode, setPrevMode] = React.useState(currentSearchState.mode);
  if (prevMode !== currentSearchState.mode) {
    setPrevMode(currentSearchState.mode);
    setActiveMode(currentSearchState.mode);
  }

  // Adjust transactionDraft state during render when URL search contactId changes
  const [prevContactId, setPrevContactId] = React.useState(currentSearchState.contactId);
  if (prevContactId !== currentSearchState.contactId) {
    setPrevContactId(currentSearchState.contactId);
    const newVpa =
      currentSearchState.resolvedContact?.vpa ||
      currentSearchState.resolvedContact?.displayName ||
      "";
    setTransactionDraft((prev) => ({
      ...prev,
      contactId: currentSearchState.contactId,
      recipientVpa: newVpa || prev.recipientVpa,
    }));
  }

  // Sync mode changes with URL search params
  const handleModeChange = (newMode: AnalyzerMode) => {
    if (newMode === activeMode) return;
    setActiveMode(newMode);
    setResultState("idle");

    const newUrl = buildAnalyzeSearchUrl({
      mode: newMode,
      contactId: newMode === "transaction" ? transactionDraft.contactId : undefined,
    });
    router.replace(newUrl, { scroll: false });

    // Focus panel heading for keyboard screen-reader accessibility on explicit mode switch
    requestAnimationFrame(() => {
      inputHeadingRef.current?.focus();
    });
  };

  const updateTransactionDraft = (updates: Partial<TransactionDraft>) => {
    setTransactionDraft((prev) => ({ ...prev, ...updates }));
  };

  const updateMessageDraft = (updates: Partial<MessageDraft>) => {
    setMessageDraft((prev) => ({ ...prev, ...updates }));
  };

  const updateReceiverDraft = (updates: Partial<ReceiverDraft>) => {
    setReceiverDraft((prev) => ({ ...prev, ...updates }));
  };

  const handleSimulateSubmit = () => {
    setResultState("loading");
    setTimeout(() => {
      setResultState("completed");
    }, 600);
  };

  const [fullTransactionDraft, setFullTransactionDraft] = React.useState<TransactionFormDraft | undefined>(undefined);
  const [fullMessageDraft, setFullMessageDraft] = React.useState<MessageFormDraft | undefined>(undefined);

  // Render form for active mode
  const renderActiveForm = () => {
    if (activeMode === "transaction") {
      if (renderTransactionForm) {
        return renderTransactionForm({
          draft: transactionDraft,
          onChange: updateTransactionDraft,
          onSubmit: handleSimulateSubmit,
        });
      }
      return (
        <TransactionForm
          contactId={currentSearchState.contactId}
          scenarioId={currentSearchState.scenarioId}
          initialDraft={fullTransactionDraft}
          onDraftChange={(newDraft) => {
            setFullTransactionDraft(newDraft);
            updateTransactionDraft({
              amount: newDraft.amount,
              recipientVpa: newDraft.receiverInput,
              note: newDraft.noteText,
              contactId: newDraft.contactId,
            });
          }}
          onRiskInputSubmit={() => {
            handleSimulateSubmit();
          }}
        />
      );
    }

    if (activeMode === "message") {
      if (renderMessageForm) {
        return renderMessageForm({
          draft: messageDraft,
          onChange: updateMessageDraft,
          onSubmit: handleSimulateSubmit,
        });
      }
      return (
        <MessageForm
          mode="standalone"
          initialDraft={fullMessageDraft}
          onDraftChange={(newDraft) => {
            setFullMessageDraft(newDraft);
            updateMessageDraft({
              rawMessage: newDraft.messageText,
              sender: newDraft.channel,
            });
          }}
          onAnalysisSubmit={() => {
            handleSimulateSubmit();
          }}
        />
      );
    }

    if (activeMode === "receiver") {
      if (renderReceiverForm) {
        return renderReceiverForm({
          draft: receiverDraft,
          onChange: updateReceiverDraft,
          onSubmit: handleSimulateSubmit,
        });
      }
      return (
        <div className="space-y-4">
          <TextField
            label="Receiver VPA to Inspect"
            placeholder="e.g. receiver.account@bank"
            value={receiverDraft.receiverVpa}
            onChange={(e) => updateReceiverDraft({ receiverVpa: e.target.value })}
            description="Evaluates temporal flow aggregates & pass-through ratios"
          />
          <Button
            variant="primary"
            className="w-full min-h-[44px]"
            onClick={handleSimulateSubmit}
          >
            Check Mule Account Signals
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Mode Selection Bar */}
      <div className="w-full max-w-md mx-auto min-[900px]:mx-0">
        <AnalyzerModeControl
          value={activeMode}
          onChange={handleModeChange}
        />
      </div>

      {/* Two-Column Responsive Workspace Grid */}
      <div className="grid grid-cols-1 min-[900px]:grid-cols-12 gap-6 items-start">
        {/* Input/Workflow Column (7 cols desktop) */}
        <div className="min-[900px]:col-span-7">
          <Panel
            as="section"
            variant="default"
            aria-labelledby="analyzer-input-heading"
            className="w-full"
          >
            <h2
              id="analyzer-input-heading"
              ref={inputHeadingRef}
              tabIndex={-1}
              className="text-base font-semibold text-[var(--text-primary,#172033)] mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring,#8ab4f8)] rounded-[4px]"
            >
              {activeMode === "transaction" && "Transaction Risk Assessment"}
              {activeMode === "message" && "Scam Message Inspector"}
              {activeMode === "receiver" && "Mule Receiver Analysis"}
            </h2>

            {renderActiveForm()}
          </Panel>
        </div>

        {/* Result/Help Column (5 cols desktop) */}
        <div className="min-[900px]:col-span-5">
          {renderResultRegion ? (
            renderResultRegion({ mode: activeMode, state: resultState })
          ) : (
            <AnalyzerResultRegion
              mode={activeMode}
              state={resultState}
              onRetry={() => setResultState("idle")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
