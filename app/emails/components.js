"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  AlertTriangle,
  X,
  Sparkles,
} from "lucide-react";

export function TemplateCard({ template, userId }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const duplicateTemplate = useMutation(api.emailTemplates.duplicate);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      await duplicateTemplate({ templateId: template._id });
      alert("Template duplicated successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error duplicating template:", error);
      alert("Failed to duplicate template: " + error.message);
    } finally {
      setIsDuplicating(false);
    }
  };

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
    <div className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-sm transition">
