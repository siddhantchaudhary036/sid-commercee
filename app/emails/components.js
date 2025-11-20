"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  Sparkles,
} from "lucide-react";

export function TemplateCard({ template }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showMenu]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryColor = (category) => {
    const colors = {
      Welcome: "bg-gray-100 text-gray-700 border-gray-300",
      "Win-back": "bg-gray-100 text-gray-700 border-gray-300",
      Promotional: "bg-gray-100 text-gray-700 border-gray-300",
      Transactional: "bg-gray-100 text-gray-700 border-gray-300",
      General: "bg-gray-100 text-gray-700 border-gray-300",
    };
    return colors[category] || colors.General;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-sm transition overflow-visible">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {template.isSystem && <Sparkles className="w-4 h-4 text-gray-400" />}
          <h3 className="text-sm font-semibold text-gray-900">
            {template.name}
          </h3>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <button
                onClick={() => {
                  setShowMenu(false);
                  router.push(`/emails/editor?id=${template._id}`);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <div className="border-t border-gray-200" />
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteModal(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-b-lg"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category & Date */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(
            template.category
          )}`}
        >
          {template.category || "General"}
        </span>
        <span className="text-xs text-gray-500">
          Created {formatDate(template.createdAt)}
        </span>
      </div>

      {/* Subject */}
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-600 mb-1">Subject:</div>
        <div className="text-sm text-gray-900 font-medium">
          {template.subject}
        </div>
      </div>

      {/* Content Preview */}
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-600 mb-1">Preview:</div>
        <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded border line-clamp-3">
          {template.content.substring(0, 150)}
          {template.content.length > 150 && "..."}
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <div className="mb-4">
          <div className="text-xs text-gray-600">{template.description}</div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push(`/emails/editor?id=${template._id}`)}
          className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Preview
        </button>
      </div>

      {/* Modals */}
      {showDeleteModal && (
        <DeleteTemplateModal
          template={template}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

function DeleteTemplateModal({ template, onClose }) {
  const deleteTemplate = useMutation(api.emailTemplates.deleteTemplate);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTemplate({ id: template._id });
      alert("Template deleted successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Delete Template</h2>
              <p className="text-xs text-gray-600">This action cannot be undone</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-6">
            Are you sure you want to delete "{template.name}"? This template will be permanently removed.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete Template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CreateTemplateModal({ onClose }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Create Email Template</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            You'll be taken to the email editor where you can design your template with HTML and see a live preview.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => router.push("/emails/editor")}
              className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Open Editor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
