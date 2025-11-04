"use client"

import React, { createContext, useContext } from "react"
import { AiAssistant } from "@/components"
import { RecaptchaAction, useRecaptcha } from "../../hooks/use-recaptcha"

export type AiAssistantFeedbackType = "upvote" | "downvote"

export type AiAssistantContextType = {
  getAnswer: (question: string, thread_id?: string) => Promise<Response>
  sendFeedback: (
    questionId: string,
    reaction: AiAssistantFeedbackType
  ) => Promise<Response>
}

const AiAssistantContext = createContext<AiAssistantContextType | null>(null)

export type AiAssistantProviderProps = {
  children?: React.ReactNode
  apiUrl: string
  recaptchaSiteKey: string
  websiteId: string
}

export const AiAssistantProvider = ({
  apiUrl,
  recaptchaSiteKey,
  websiteId,
  children,
}: AiAssistantProviderProps) => {
  const { execute: getReCaptchaToken } = useRecaptcha({
    siteKey: recaptchaSiteKey,
  })

  const sendRequest = async (
    apiPath: string,
    action: RecaptchaAction,
    method = "GET",
    headers?: HeadersInit,
    body?: BodyInit
  ) => {
    return await fetch(`${apiUrl}${apiPath}`, {
      method,
      headers: {
        "X-RECAPTCHA-TOKEN": await getReCaptchaToken(action),
        "X-WEBSITE-ID": websiteId,
        ...headers,
      },
      body,
    })
  }

  const getAnswer = async (question: string, threadId?: string) => {
    const questionParam = encodeURI(question)
    return await sendRequest(
      threadId
        ? `/query/v1/thread/${threadId}/stream?query=${questionParam}`
        : `/query/v1/stream?query=${questionParam}`,
      RecaptchaAction.AskAi
    )
  }

  const sendFeedback = async (
    questionId: string,
    reaction: AiAssistantFeedbackType
  ) => {
    return await sendRequest(
      `/query/v1/question-answer/${questionId}/feedback`,
      RecaptchaAction.FeedbackSubmit,
      "POST",
      {
        "Content-Type": "application/json",
      },
      JSON.stringify({
        question_id: questionId,
        reaction,
      })
    )
  }

  return (
    <AiAssistantContext.Provider
      value={{
        getAnswer,
        sendFeedback,
      }}
    >
      {children}
      <AiAssistant />
    </AiAssistantContext.Provider>
  )
}

export const useAiAssistant = () => {
  const context = useContext(AiAssistantContext)

  if (!context) {
    throw new Error("useAiAssistant must be used within a AiAssistantProvider")
  }

  return context
}
