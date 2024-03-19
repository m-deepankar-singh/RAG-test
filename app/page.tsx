"use client";
import React, { useState } from "react";
import axios from "axios";
import * as z from "zod";
import { Heading } from "@/components/heading";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/loader";
import { ModeToggle } from "../components/mode-toggle";
import FileUpload from "@/components/FileUpload";
import FileDelete from "@/components/FileDelete";
import FileProcessing from "@/components/FileProcessing";

interface Message {
  role: "user" | "bot";
  content: string;
}

const ConversationPage = () => {
  axios.defaults.baseURL = "http://localhost:8000";
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [filesUploaded, setFilesUploaded] = useState(false);

  const chatForm = useForm({
    resolver: zodResolver(
      z.object({
        message: z.string().min(1, { message: "Message is required." }),
      })
    ),
  });

  const onChatSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/chat", { message: data.message });
      setMessages([
        ...messages,
        { role: "user", content: data.message },
        { role: "bot", content: response.data },
      ]);
    } catch (error) {
      console.error("Error in chat: ", error);
    }
    setIsLoading(false);
    chatForm.reset();
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4">
        <Heading
          title="Interactive Chatbot"
          description="Engage in a conversation. Provide a URL for contextual responses."
        />
        <div className="mt-4">
          <FileUpload
            onFileSelect={(selectedFiles) => {
              setFiles(Array.from(selectedFiles || []));
              setFilesUploaded(true);
            }}
          />
          {filesUploaded && (
            <div className="mt-4">
              <FileProcessing />
            </div>
          )}
        </div>
        {/* <div className="mt-auto text-center p-8">
          <ModeToggle />
        </div> */}
      </div>

      {/* Chat Interface */}
      <div className="flex-1 p-4">
        <div className="flex flex-col h-full">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto mb-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="font-semibold">
                    {message.role === "user" ? "User" : "Bot"}
                  </p>
                  <p>{message.content}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Loading Indicator */}
          {isLoading && (
            <div className="mt-4 flex justify-center p-4">
              <Loader />
            </div>
          )}

          {/* Chat Input */}
          <div className="mt-auto flex items-center">
            <FileDelete />
            <div className="flex-1">
              <Form {...chatForm}>
                <form
                  onSubmit={chatForm.handleSubmit(onChatSubmit)}
                  className="flex items-center"
                >
                  <FormField
                    name="message"
                    render={({ field }) => (
                      <FormItem className="flex-1 mr-4">
                        <FormControl className="m-0 p-0">
                          <Input {...field} placeholder=" Type your message " />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="px-4 py-2">
                    Send
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;
