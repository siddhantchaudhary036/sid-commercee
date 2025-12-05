"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Eye, Code, Send } from "lucide-react";
import Sidebar from "../../components/Sidebar";

function EmailEditorContent() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const template = useQuery(
    api.emailTemplates.getById,
    templateId ? { id: templateId } : "skip"
  );

  const createTemplate = useMutation(api.emailTemplates.create);
  const updateTemplate = useMutation(api.emailTemplates.update);

  // Load template data if editing
  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject);
      setHtmlContent(template.content);
      setDescription(template.description || "");
      setCategory(template.category);
    }
  }, [template]);

  // Set default HTML template for new emails
  useEffect(() => {
    if (!templateId && htmlContent === "") {
      setHtmlContent(DEFAULT_EMAIL_TEMPLATE);
    }
  }, [templateId, htmlContent]);

  const handleSave = async () => {
    if (!convexUser) return;

    setIsSaving(true);
    try {
      if (templateId) {
        await updateTemplate({
          id: templateId,
          name,
          subject,
          content: htmlContent,
          description,
          category,
        });
      } else {
        await createTemplate({
          userId: convexUser._id,
          name,
          subject,
          content: htmlContent,
          description,
          category,
        });
      }
      router.push("/emails");
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!subject || !htmlContent) {
      alert("Please add a subject and HTML content before sending a test email");
      return;
    }

    setIsSendingTest(true);
    try {
      const response = await fetch("/api/emails/send-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          htmlContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send test email");
      }

      alert(`Test email sent successfully to your email!`);
    } catch (error) {
      console.error("Error sending test email:", error);
      alert("Failed to send test email: " + error.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  if (!user || !convexUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/emails")}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {templateId ? "Edit Template" : "Create Template"}
                  </h1>
                  <p className="text-xs text-gray-500">
                    Design your email with HTML
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSendTest}
                  disabled={isSendingTest || !subject || !htmlContent}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSendingTest ? "Sending..." : "Send Test Email"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !name || !subject || !htmlContent}
                  className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save Template"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Template Info */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Welcome Email"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="Welcome">Welcome</option>
                <option value="Win-back">Win-back</option>
                <option value="Promotional">Promotional</option>
                <option value="Transactional">Transactional</option>
                <option value="General">General</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Welcome to our store!"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of when to use this template"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Split Editor */}
        <div className="flex-1 flex overflow-hidden">
          {/* HTML Editor */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <Code className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">HTML Editor</span>
            </div>
            <div className="flex-1 overflow-auto">
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="w-full h-full p-6 text-sm font-mono resize-none focus:outline-none"
                placeholder="Enter your HTML here..."
                spellCheck={false}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="w-1/2 flex flex-col bg-gray-50">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">Preview</span>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <EmailPreview html={htmlContent} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailEditorPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading editor...</div>}>
      <EmailEditorContent />
    </Suspense>
  );
}

function EmailPreview({ html }) {
  // Extract body content from full HTML document
  const getBodyContent = (htmlString) => {
    const bodyMatch = htmlString.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      return bodyMatch[1];
    }
    return htmlString;
  };

  const bodyContent = getBodyContent(html);

  return (
    <div
      className="p-6"
      dangerouslySetInnerHTML={{ __html: bodyContent }}
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        lineHeight: '1.6',
      }}
    />
  );
}

const DEFAULT_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: #111111;">Welcome!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Hi {{firstName}},
              </p>
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Thank you for joining us! We're excited to have you on board.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Get started by exploring our products and services.
              </p>
            </td>
          </tr>
          
          <!-- Button -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="#" style="display: inline-block; padding: 12px 32px; background-color: #111111; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                Get Started
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © 2024 Your Company. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
