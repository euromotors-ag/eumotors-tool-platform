/**
 * Enterprise-grade Equipment Section
 * Single section showing all equipment items with validation
 */

import { useMemo, useState } from "react";
import {
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  Database,
  Link2,
  Trash2,
} from "lucide-react";
import { useJsonEditorStore } from "../../stores/json-editor.store";
import { EquipmentItem } from "../../types/json-editor.types";
import { equipmentApi } from "../../api/equipment.api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface EquipmentSectionProps {
  dictionary: Record<string, EquipmentItem>;
}

export function EquipmentSection({ dictionary }: EquipmentSectionProps) {
  const workingJson = useJsonEditorStore((state) => state.workingJson);
  const validationState = useJsonEditorStore((state) => state.validationState);
  const unknownEquipment = useJsonEditorStore(
    (state) => state.unknownEquipment
  );
  const addEquipment = useJsonEditorStore((state) => state.addEquipment);
  const addCustomEquipment = useJsonEditorStore(
    (state) => state.addCustomEquipment
  );
  const removeEquipment = useJsonEditorStore((state) => state.removeEquipment);
  const mapEquipment = useJsonEditorStore((state) => state.mapEquipment);
  const validateEquipment = useJsonEditorStore(
    (state) => state.validateEquipment
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [newCode, setNewCode] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "valid" | "unknown">(
    "all"
  );
  const [mappingCode, setMappingCode] = useState<string | null>(null);
  const [mappingSearch, setMappingSearch] = useState("");
  const queryClient = useQueryClient();

  const equipment = workingJson?.equipment || [];

  // Filter equipment based on tab and search
  const filteredEquipment = useMemo(() => {
    let filtered = equipment;

    // Filter by tab
    if (activeTab === "valid") {
      filtered = equipment.filter((code) => {
        const status = validationState[code]?.status || "unknown";
        return status === "valid";
      });
    } else if (activeTab === "unknown") {
      filtered = equipment.filter((code) => {
        const status = validationState[code]?.status || "unknown";
        return status === "unknown";
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((code) => code.toLowerCase().includes(query));
    }

    return filtered;
  }, [equipment, searchQuery, activeTab, validationState]);

  // Get available equipment codes for autocomplete
  const availableCodes = useMemo(() => {
    return Object.keys(dictionary).sort();
  }, [dictionary]);

  const handleAdd = () => {
    if (newCode.trim() && !equipment.includes(newCode.trim())) {
      addEquipment(newCode.trim().toUpperCase());
      setNewCode("");
    }
  };

  const handleAddCustom = () => {
    if (customCode.trim() && !equipment.includes(customCode.trim())) {
      addCustomEquipment(customCode.trim());
      setCustomCode("");
    }
  };

  const getValidationStatus = (code: string) => {
    return validationState[code]?.status || "unknown";
  };

  // Get suggestions for unknown equipment
  const getSuggestions = (code: string): string[] => {
    const prefix = code.split("_")[0].toUpperCase();
    return Object.keys(dictionary)
      .filter((dictCode) => dictCode.startsWith(prefix))
      .slice(0, 3);
  };

  // Fetch all canonical equipment for mapping
  const { data: canonicalEquipment = [] } = useQuery({
    queryKey: ["canonical-equipment"],
    queryFn: () => equipmentApi.getAllCanonical(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle add to database
  const handleAddToDatabase = async (code: string) => {
    try {
      // Convert code (e.g., "BLACK_ROOF_RAILS") to name format (e.g., "BLACK ROOF RAILS")
      const name = code.replace(/_/g, " ").toUpperCase();

      await equipmentApi.createEquipment({
        name: name,
        binCategory: "bin_good",
        source: "json-editor",
      });

      // Invalidate dictionary cache to refresh
      queryClient.invalidateQueries({ queryKey: ["equipment-dictionary"] });

      // Wait a bit for cache to refresh, then re-validate
      setTimeout(() => {
        if (workingJson?.equipment) {
          validateEquipment(workingJson.equipment);
        }
      }, 500);
    } catch (error) {
      console.error("Failed to add equipment to database:", error);
      alert(
        `Failed to add equipment: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // Handle map to existing
  const handleMapToExisting = async (
    unknownCode: string,
    targetEquipmentId: string
  ) => {
    try {
      await equipmentApi.mapToExistingCanonical(
        unknownCode,
        "json-editor",
        targetEquipmentId
      );

      // Find the target equipment
      const targetEquipment = canonicalEquipment.find(
        (e) => e.id === targetEquipmentId
      );
      if (targetEquipment) {
        // Get the code from target equipment (use code if available, otherwise generate from name)
        const targetCode =
          targetEquipment.code ||
          targetEquipment.name.toUpperCase().replace(/\s+/g, "_");
        // Replace unknown code with mapped code in JSON
        mapEquipment(unknownCode, targetCode);
      }

      // Invalidate dictionary cache
      queryClient.invalidateQueries({ queryKey: ["equipment-dictionary"] });
    } catch (error) {
      console.error("Failed to map equipment:", error);
      alert(
        `Failed to map equipment: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // Handle add to trash
  const handleAddToTrash = async (code: string) => {
    try {
      // Convert code to name format for API
      const name = code.replace(/_/g, " ").toUpperCase();
      await equipmentApi.markAsTrash(
        name,
        "json-editor",
        "Marked as trash from JSON editor"
      );

      // Remove from equipment list in JSON
      removeEquipment(code);

      // Invalidate dictionary cache
      queryClient.invalidateQueries({ queryKey: ["equipment-dictionary"] });
    } catch (error) {
      console.error("Failed to add equipment to trash:", error);
      alert(
        `Failed to add to trash: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-card p-4 shadow-lg border border-border">
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-green-500/10 blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-yellow-500/10 blur-3xl"></div>

      <div className="relative z-10 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex-1">
            <h3 className="text-xs font-semibold text-green-400 border-b border-green-400/40 pb-0.5 mb-1">
              Equipment
            </h3>
            {/* Tabs */}
            <div className="flex items-center gap-1 mt-1">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-2 py-0.5 text-xs rounded transition-all flex items-center gap-1 ${
                  activeTab === "all"
                    ? "bg-gray-700 text-gray-200 border border-gray-600"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                }`}>
                All ({equipment.length})
              </button>
              <button
                onClick={() => setActiveTab("valid")}
                className={`px-2 py-0.5 text-xs rounded transition-all flex items-center gap-1 ${
                  activeTab === "valid"
                    ? "bg-gray-700 text-gray-200 border border-gray-600"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                }`}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                Valid ({equipment.length - unknownEquipment.length})
              </button>
              <button
                onClick={() => setActiveTab("unknown")}
                className={`px-2 py-0.5 text-xs rounded transition-all flex items-center gap-1 ${
                  activeTab === "unknown"
                    ? "bg-gray-700 text-gray-200 border border-gray-600"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                }`}>
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                Unknown ({unknownEquipment.length})
              </button>
            </div>
          </div>
        </div>

        {/* Search and Add - All on same row */}
        <div className="flex gap-1 mb-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-xs border border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-200 placeholder-gray-400 transition-all h-[26px]"
            />
          </div>

          {/* Add new equipment from database */}
          <div className="flex gap-1 flex-1 min-w-0">
            <input
              type="text"
              placeholder="Enter code or Select from list..."
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              list="equipment-codes"
              className="flex-1 min-w-0 px-1.5 py-1 text-xs border border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-200 placeholder-gray-400 transition-all h-[26px]"
            />
            <datalist id="equipment-codes">
              {availableCodes.map((code) => (
                <option key={code} value={code} />
              ))}
            </datalist>
            <button
              onClick={handleAdd}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 rounded border border-gray-500 flex items-center justify-center transition-all h-[26px] aspect-square shrink-0">
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Add custom equipment (not in database) */}
          <div className="flex gap-1 flex-1 min-w-0 items-center">
            <input
              type="text"
              placeholder="Add custom equipment (not in database)..."
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
              className="flex-1 min-w-0 px-1.5 py-1 text-xs border border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-gray-200 placeholder-gray-400 transition-all h-[26px]"
            />
            <button
              onClick={handleAddCustom}
              className="px-2 py-1 text-xs bg-purple-600/50 hover:bg-purple-600/70 text-purple-200 rounded border border-purple-500/50 flex items-center justify-center transition-all h-[26px] aspect-square shrink-0"
              title="Add custom equipment that won't be validated against database">
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Equipment list */}
        <div className="border border-gray-700 rounded max-h-64 overflow-y-auto bg-gray-800/40">
          {filteredEquipment.length === 0 ? (
            <div className="p-2 text-center text-gray-500 text-xs">
              No equipment items
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {filteredEquipment.map((code) => {
                const status = getValidationStatus(code);
                const isUnknown = status === "unknown";
                const isCustom = status === "custom";
                const suggestions = isUnknown ? getSuggestions(code) : [];

                return (
                  <div
                    key={code}
                    className={`p-1.5 flex items-center justify-between hover:bg-gray-700/50 transition-colors ${
                      isUnknown
                        ? "bg-yellow-500/10"
                        : isCustom
                        ? "bg-purple-500/10"
                        : ""
                    }`}>
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {status === "valid" ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                      ) : isCustom ? (
                        <AlertCircle className="h-3 w-3 text-purple-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-yellow-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs font-medium truncate text-gray-200">
                          {code}
                        </div>
                        {isCustom && (
                          <div className="mt-0.5 text-xs text-purple-400 italic">
                            Custom (not in database)
                          </div>
                        )}
                        {isUnknown && suggestions.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {suggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => mapEquipment(code, suggestion)}
                                className="text-xs px-1 py-0.5 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 flex items-center gap-0.5">
                                Map: {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-1 ml-1">
                      {isUnknown && (
                        <>
                          {/* Add to Database */}
                          <button
                            onClick={() => handleAddToDatabase(code)}
                            className="p-0.5 text-green-400 hover:bg-green-500/20 rounded transition-all"
                            title="Add to Database">
                            <Database className="h-3 w-3" />
                          </button>

                          {/* Map to Existing */}
                          <button
                            onClick={() =>
                              setMappingCode(mappingCode === code ? null : code)
                            }
                            className={`p-0.5 rounded transition-all ${
                              mappingCode === code
                                ? "bg-blue-500/30 text-blue-300"
                                : "text-blue-400 hover:bg-blue-500/20"
                            }`}
                            title="Map to Existing">
                            <Link2 className="h-3 w-3" />
                          </button>

                          {/* Add to Trash */}
                          <button
                            onClick={() => handleAddToTrash(code)}
                            className="p-0.5 text-orange-400 hover:bg-orange-500/20 rounded transition-all"
                            title="Add to Trash">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => removeEquipment(code)}
                        className="p-0.5 text-red-400 hover:bg-red-500/20 rounded transition-all"
                        title="Delete">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mapping Modal */}
        {mappingCode && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setMappingCode(null)}>
            <div
              className="bg-gray-800 border border-gray-700 rounded-lg p-3 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-200">
                  Map "{mappingCode}" to Existing Equipment
                </h4>
                <button
                  onClick={() => {
                    setMappingCode(null);
                    setMappingSearch("");
                  }}
                  className="text-gray-400 hover:text-gray-200">
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Search in modal */}
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search equipment..."
                  value={mappingSearch}
                  onChange={(e) => setMappingSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs border border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-200 placeholder-gray-400 transition-all"
                />
              </div>

              {/* Equipment list */}
              <div className="flex-1 overflow-y-auto space-y-1 mb-2">
                {canonicalEquipment
                  .filter((eq) => {
                    if (!mappingSearch) return true;
                    const query = mappingSearch.toLowerCase();
                    return (
                      eq.name.toLowerCase().includes(query) ||
                      (eq.code && eq.code.toLowerCase().includes(query)) ||
                      (eq.category && eq.category.toLowerCase().includes(query))
                    );
                  })
                  .map((eq) => (
                    <button
                      key={eq.id}
                      onClick={() => {
                        handleMapToExisting(mappingCode, eq.id);
                        setMappingCode(null);
                        setMappingSearch("");
                      }}
                      className="w-full text-left px-2 py-1 text-xs bg-gray-700/50 hover:bg-gray-700 rounded border border-gray-600 hover:border-blue-500 transition-all">
                      <div className="font-medium text-gray-200 truncate">
                        {eq.name}
                      </div>
                      {eq.code && (
                        <div className="text-xs text-gray-400 font-mono truncate">
                          {eq.code}
                        </div>
                      )}
                      {eq.category && (
                        <div className="text-xs text-gray-500 truncate">
                          {eq.category}
                        </div>
                      )}
                    </button>
                  ))}
                {canonicalEquipment.filter((eq) => {
                  if (!mappingSearch) return false;
                  const query = mappingSearch.toLowerCase();
                  return (
                    eq.name.toLowerCase().includes(query) ||
                    (eq.code && eq.code.toLowerCase().includes(query)) ||
                    (eq.category && eq.category.toLowerCase().includes(query))
                  );
                }).length === 0 &&
                  mappingSearch && (
                    <div className="text-xs text-gray-500 text-center py-2">
                      No equipment found
                    </div>
                  )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
                <button
                  onClick={() => {
                    setMappingCode(null);
                    setMappingSearch("");
                  }}
                  className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unknown equipment summary */}
        {unknownEquipment.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3 text-yellow-500" />
                <span className="text-xs font-medium text-yellow-300">
                  {unknownEquipment.length} unknown equipment code
                  {unknownEquipment.length > 1 ? "s" : ""}
                </span>
              </div>
              <button
                onClick={() =>
                  unknownEquipment.forEach((code) => removeEquipment(code))
                }
                className="text-xs text-yellow-300 hover:text-yellow-200 underline">
                Remove All
              </button>
            </div>
            <p className="text-xs text-yellow-200/80 leading-tight">
              These codes are not found in the equipment dictionary. Use the
              action buttons (Database, Map, Trash) to handle them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
