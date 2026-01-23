"use client"

import { ArrowUpMini, Telescope } from "@medusajs/icons"
import clsx from "clsx"
import { BloomIcon, Button, HeadlineTags, useAiAssistant } from "docs-ui"
import { useState } from "react"
import HomepageEdges from "../Edges"

const HomepageBloom = () => {
  const {
    setChatOpened,
    submitQuery,
    deepThinkingEnabled,
    toggleDeepThinking,
  } = useAiAssistant()
  const [question, setQuestion] = useState("")
  const [showCustomCarat, setShowCustomCaret] = useState(false)

  const handleSubmit = (overrideQuestion?: string) => {
    submitQuery(overrideQuestion || question)
    setChatOpened(true)
    setQuestion("")
  }

  const suggestions: {
    tag: string
    questions: string[]
  }[] = [
    {
      tag: "FAQ",
      questions: [
        "What is Medusa?",
        "How can I build with Medusa and AI agents?",
        "How can I extend the product data model?",
        "How to create an admin user?",
        "How do I deploy Medusa to production?",
      ],
    },
    {
      tag: "Recipes",
      questions: [
        "How do I build a marketplace?",
        "How do I build digital products?",
        "How do I build subscription-based purchases?",
        "What other recipes are available?",
      ],
    },
  ]

  return (
    <div className="w-full flex gap-0 items-center border-y border-medusa-border-base flex-col lg:flex-row">
      {/* Chat area */}
      <div
        className={clsx(
          "w-full lg:w-1/2 bg-medusa-bg-component relative",
          "flex flex-col justify-between gap-2",
          "p-2 border-r border-medusa-border-base",
          "border-b lg:border-b-0"
        )}
      >
        <BloomIcon className="w-2 h-2 text-medusa-fg-subtle" />
        <span className="text-h1 text-pretty">
          Hello! I’m Bloom, your go to ecommerce assistant. How can I help you?
        </span>
        <div className="flex flex-col justify-between lg:gap-2">
          <div className="w-full flex-1 py-0.75 border-t border-medusa-border-base">
            <div className="w-full relative">
              <textarea
                className={clsx(
                  "appearance-none text-base placeholder:text-medusa-fg-muted",
                  "bg-transparent resize-none w-full focus:outline-none",
                  "h-1.5 lg:h-auto",
                  !question && "caret-transparent"
                )}
                placeholder="Ask anything about Medusa..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onFocus={() => setShowCustomCaret(true)}
                onBlur={() => setShowCustomCaret(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              ></textarea>
              {!question && showCustomCarat && (
                <span className="block h-[21px] w-[7.5px] bg-medusa-fg-base absolute top-px left-0 animate-[pulse_0.8s_ease-in-out_infinite] rounded-xxs" />
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <Button
              variant="transparent-clear"
              onClick={toggleDeepThinking}
              className={clsx(
                "focus:!shadow-none active:!shadow-none",
                deepThinkingEnabled &&
                  "!text-medusa-fg-base !bg-medusa-button-transparent-hover focus:!bg-medusa-button-transparent-hover active:!bg-medusa-button-transparent-hover",
                !deepThinkingEnabled &&
                  "focus:!bg-transparent active:!bg-transparent"
              )}
            >
              <Telescope />
            </Button>
            <Button
              variant="primary"
              className="rounded-full !p-[6.5px]"
              disabled={!question}
              onClick={() => handleSubmit()}
            >
              <ArrowUpMini />
            </Button>
          </div>
        </div>
        <HomepageEdges />
      </div>
      {/* Chat suggestions area */}
      <div
        className={clsx(
          "w-full lg:w-1/2 flex justify-start lg:justify-center",
          "px-2 py-2 lg:py-0"
        )}
      >
        <div className="flex gap-2 flex-col">
          {suggestions.map((section, index) => (
            <div className="flex gap-0.75 flex-col" key={index}>
              <HeadlineTags tags={[section.tag]} className="!justify-start" />
              <div className="flex gap-0.5 flex-col">
                {section.questions.map((question, qIndex) => (
                  <div className="w-fit" key={qIndex}>
                    <button
                      className={clsx(
                        "flex px-[6px] py-x appearance-none text-left",
                        "rounded-xs bg-medusa-alphas-alpha-6 font-monospace",
                        "text-code-paragraph-xsmall text-medusa-fg-subtle hover:text-medusa-fg-base"
                      )}
                      onClick={() => handleSubmit(question)}
                    >
                      {question}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HomepageBloom
