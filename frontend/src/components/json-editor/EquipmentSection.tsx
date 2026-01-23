import { useMemo, useState, useEffect } from "react";
import {
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  Database,
  Link2,
  Trash2,
  CirclePlus,
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
  const markEquipmentAsCustom = useJsonEditorStore(
    (state) => state.markEquipmentAsCustom
  );
  const removeEquipment = useJsonEditorStore((state) => state.removeEquipment);
  const mapEquipment = useJsonEditorStore((state) => state.mapEquipment);
  const recordEquipmentMapping = useJsonEditorStore(
    (state) => state.recordEquipmentMapping
  );
  const recordEquipmentAdded = useJsonEditorStore(
    (state) => state.recordEquipmentAdded
  );
  const recordEquipmentTrashed = useJsonEditorStore(
    (state) => state.recordEquipmentTrashed
  );
  const equipmentOverlay = useJsonEditorStore(
    (state) => state.equipmentOverlay
  );
  const dictionaryMappings = useJsonEditorStore(
    (state) => state.dictionaryMappings
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [newCode, setNewCode] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [newDatabaseCode, setNewDatabaseCode] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "valid" | "unknown">(
    "all"
  );
  const [mappingCode, setMappingCode] = useState<string | null>(null);
  const [mappingSearch, setMappingSearch] = useState("");
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Block body scroll when mapping modal is open
  useEffect(() => {
    if (mappingCode) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Block scroll on body
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      // Restore scroll when modal closes
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    // Cleanup function to restore scroll if component unmounts with modal open
    return () => {
      if (mappingCode) {
        const scrollY = document.body.style.top;
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || "0") * -1);
        }
      }
    };
  }, [mappingCode]);

  const equipment = workingJson?.equipment || [];

  // Normalize equipment: map raw codes to canonical names for display
  // Structure: { displayCode: string, rawCodes: string[], isMapped: boolean }
  // Note: equipment array now contains names (after conversion), but we need to show mapping info
  const normalizedEquipment = useMemo(() => {
    // Build reverse mapping: name -> raw codes that map to it
    // This allows us to show "(Mapped)" even when equipment already contains names
    const nameToRawCodes = new Map<string, string[]>();
    const unmappedNames: string[] = [];

    // First, collect all raw codes that map to each name from dictionary mappings
    // This creates a reverse lookup: name -> [raw codes]
    // Handle both single mapping (string) and multi-mapping (string[])
    Object.entries(dictionaryMappings).forEach(([rawValue, mappedValue]) => {
      const names = Array.isArray(mappedValue) ? mappedValue : [mappedValue];
      names.forEach((name) => {
        const existing = nameToRawCodes.get(name) || [];
        if (!existing.includes(rawValue)) {
          nameToRawCodes.set(name, [...existing, rawValue]);
        }
      });
    });

    // Also check session overlay mappings (these take precedence)
    // Handle both single mapping (string) and multi-mapping (string[])
    Object.entries(equipmentOverlay.mappedCodes).forEach(([rawCode, mappedValue]) => {
      const names = Array.isArray(mappedValue) ? mappedValue : [mappedValue];
      names.forEach((name) => {
        const existing = nameToRawCodes.get(name) || [];
        if (!existing.includes(rawCode)) {
          nameToRawCodes.set(name, [...existing, rawCode]);
        }
      });
    });

    // Now process equipment array (which contains names)
    equipment.forEach((equipmentName) => {
      const rawCodesForThisName = nameToRawCodes.get(equipmentName);
      
      if (rawCodesForThisName && rawCodesForThisName.length > 0) {
        // This name was mapped from one or more raw codes
        const existing = nameToRawCodes.get(equipmentName) || [];
        nameToRawCodes.set(equipmentName, existing);
      } else {
        // This name is not mapped (it's a direct name, not from a mapping)
        unmappedNames.push(equipmentName);
      }
    });

    // Build normalized list
    const normalized: Array<{
      displayCode: string; // What to show in UI (equipment name)
      rawCodes: string[]; // All raw codes that map to this name (for tooltip)
      isMapped: boolean; // Whether this name was mapped from raw codes
    }> = [];

    // Add mapped names (one entry per name, with all raw codes that map to it)
    equipment.forEach((equipmentName) => {
      // Check if we already added this name
      if (normalized.some(item => item.displayCode === equipmentName)) {
        return;
      }

      const rawCodesForThisName = nameToRawCodes.get(equipmentName);
      if (rawCodesForThisName && rawCodesForThisName.length > 0) {
        // This name is mapped
        normalized.push({
          displayCode: equipmentName,
          rawCodes: rawCodesForThisName,
          isMapped: true,
        });
      } else {
        // This name is not mapped (direct name)
        normalized.push({
          displayCode: equipmentName,
          rawCodes: [equipmentName], // Use name itself as "raw code" for validation
          isMapped: false,
        });
      }
    });

    return normalized;
  }, [equipment, equipmentOverlay.mappedCodes, dictionaryMappings]);

  // Filter equipment based on tab and search (using normalized equipment)
  const filteredEquipment = useMemo(() => {
    let filtered = normalizedEquipment;

    // Filter by tab - check status using displayCode (name) since validationState is keyed by names
    if (activeTab === "valid") {
      filtered = normalizedEquipment.filter((item) => {
        // Use displayCode (which is the name) to check validation status
        const status = validationState[item.displayCode]?.status || "unknown";
        return status === "valid" || status === "custom";
      });
    } else if (activeTab === "unknown") {
      filtered = normalizedEquipment.filter((item) => {
        const status = validationState[item.displayCode]?.status || "unknown";
        return status === "unknown";
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        // Search both display code and raw codes
        return (
          item.displayCode.toLowerCase().includes(query) ||
          item.rawCodes.some((code) => code.toLowerCase().includes(query))
        );
      });
    }

    return filtered;
  }, [normalizedEquipment, searchQuery, activeTab, validationState]);

  // Get available equipment codes for autocomplete
  const availableCodes = useMemo(() => {
    return Object.keys(dictionary).sort();
  }, [dictionary]);

  // Get available equipment items sorted by name for dropdown display
  const availableEquipmentItems = useMemo(() => {
    return Object.entries(dictionary)
      .map(([code, item]) => ({ code, name: item.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
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

  // Fetch all canonical equipment for mapping
  const { data: canonicalEquipment = [] } = useQuery({
    queryKey: ["canonical-equipment"],
    queryFn: () => equipmentApi.getAllCanonical(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle add new equipment to database (from input field)
  const handleAddNewToDatabase = async () => {
    if (!newDatabaseCode.trim()) return;
    
    try {
      const code = newDatabaseCode.trim().toUpperCase();
      
      // Check if already exists
      if (canonicalEquipment.some(e => e.name.toUpperCase() === code || e.code === code)) {
        alert(`Equipment "${code}" already exists in database. Use "Add from database" instead.`);
        setNewDatabaseCode("");
        return;
      }

      // Add to database as new canonical equipment
      await equipmentApi.approveAsNewCanonical(
        code,
        "json-editor"
      );

      // Record in session overlay (immediate effect across all files)
      recordEquipmentAdded(code);

      // Add to current JSON
      addEquipment(code);

      // Clear input
      setNewDatabaseCode("");

      // Invalidate dictionary cache to refresh
      queryClient.invalidateQueries({ queryKey: ["equipment-dictionary"] });
      // Also invalidate canonical equipment cache so mapping modal updates
      queryClient.invalidateQueries({ queryKey: ["canonical-equipment"] });
    } catch (error) {
      console.error("Failed to add equipment to database:", error);
      alert(
        `Failed to add equipment to database: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
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

  // Handle add to database (for unknown equipment items)
  const handleAddToDatabase = async (code: string) => {
    try {
      // Convert code (e.g., "BLACK_ROOF_RAILS") to name format (e.g., "BLACK ROOF RAILS")
      const name = code.replace(/_/g, " ").toUpperCase();

      await equipmentApi.createEquipment({
        name: name,
        binCategory: "bin_good",
        source: "json-editor",
      });

      // Record in session overlay (immediate effect across all files)
      recordEquipmentAdded(code);

      // Invalidate dictionary cache to refresh (for future sessions)
      queryClient.invalidateQueries({ queryKey: ["equipment-dictionary"] });
      // Also invalidate canonical equipment cache so mapping modal updates
      queryClient.invalidateQueries({ queryKey: ["canonical-equipment"] });
    } catch (error) {
      console.error("Failed to add equipment to database:", error);
      alert(
        `Failed to add equipment: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  // Handle map to existing (supports both single and multi-mapping)
  const handleMapToExisting = async (
    unknownCode: string,
    targetEquipmentIds: string[]
  ) => {
    try {
      // Call API with array of equipment IDs
      await equipmentApi.mapToExistingCanonical(
        unknownCode,
        "json-editor",
        targetEquipmentIds[0], // Backward compatibility: first ID
        targetEquipmentIds // Multi-mapping: array of IDs
      );

      // Find all target equipment items
      const targetEquipmentItems = canonicalEquipment.filter(
        (e) => targetEquipmentIds.includes(e.id)
      );
      
      if (targetEquipmentItems.length > 0) {
        // Use equipment names (not codes) - names are what should appear in JSON
        const targetNames = targetEquipmentItems.map(e => e.name);
        
        // Record mapping in session overlay (immediate effect across all files)
        // For multi-mapping, pass array of names
        recordEquipmentMapping(unknownCode, targetNames.length > 1 ? targetNames : targetNames[0]);
        
        // For single mapping, also call mapEquipment for consistency
        // For multi-mapping, recordEquipmentMapping already expanded it to all names
        if (targetNames.length === 1) {
          mapEquipment(unknownCode, targetNames[0]);
        }
      }

      // Invalidate dictionary cache (for future sessions)
      queryClient.invalidateQueries({ queryKey: ["equipment-dictionary"] });
      // Also invalidate canonical equipment cache so mapping modal updates
      queryClient.invalidateQueries({ queryKey: ["canonical-equipment"] });
      
      // Close modal and reset selection
      setMappingCode(null);
      setMappingSearch("");
      setSelectedEquipmentIds([]);
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

      // Record in session overlay (immediate effect across all files)
      recordEquipmentTrashed(code);

      // Remove from equipment list in JSON
      removeEquipment(code);

      // Invalidate dictionary cache (for future sessions)
      queryClient.invalidateQueries({ queryKey: ["equipment-dictionary"] });
      // Also invalidate canonical equipment cache so mapping modal updates
      queryClient.invalidateQueries({ queryKey: ["canonical-equipment"] });
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
            <h3 className="text-xs font-semibold text-green-400 border-b border-green-400/40 pb-0.5 mb-1.5">
              Equipment
            </h3>
            {/* Tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-2 py-0.5 text-xs rounded transition-all flex items-center gap-1 ${
                  activeTab === "all"
                    ? "bg-gray-700 text-gray-200 border border-gray-600"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                }`}>
                All ({normalizedEquipment.length})
              </button>
              <button
                onClick={() => setActiveTab("valid")}
                className={`px-2 py-0.5 text-xs rounded transition-all flex items-center gap-1 ${
                  activeTab === "valid"
                    ? "bg-gray-700 text-gray-200 border border-gray-600"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                }`}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                Valid ({normalizedEquipment.filter((item) => {
                  const firstRawCode = item.rawCodes[0];
                  const status = validationState[firstRawCode]?.status || "unknown";
                  return status === "valid" || status === "custom";
                }).length})
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
        <div className="flex gap-1 mb-3 items-center flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-xs border border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-200 placeholder-gray-400 transition-all h-[26px]"
            />
          </div>

          {/* Add new equipment from database - Dropdown */}
          <div className="flex gap-1 flex-1 min-w-[200px]">
            <select
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              style={{
                color: newCode ? '#e5e7eb' : '#9ca3af' // text-gray-200 : text-gray-400
              }}
              className="flex-1 min-w-0 px-1.5 py-1 text-xs border border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 transition-all h-[26px] cursor-pointer [&>option]:bg-gray-700 [&>option]:text-gray-200"
              title="Select equipment from database">
              <option value="" style={{ color: '#9ca3af' }}>Select from database...</option>
              {availableEquipmentItems.map((item) => (
                <option key={item.code} value={item.code} style={{ color: '#e5e7eb' }}>
                  {item.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!newCode}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-200 rounded border border-gray-500 flex items-center justify-center transition-all h-[26px] aspect-square shrink-0"
              title="Add selected equipment from database">
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Add new equipment to database */}
          <div className="flex gap-1 flex-1 min-w-[200px] items-center">
            <input
              type="text"
              placeholder="Add new to database..."
              value={newDatabaseCode}
              onChange={(e) => setNewDatabaseCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddNewToDatabase()}
              className="flex-1 min-w-0 px-1.5 py-1 text-xs border border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-gray-700 text-gray-200 placeholder-gray-400 transition-all h-[26px]"
            />
            <button
              onClick={handleAddNewToDatabase}
              className="px-2 py-1 text-xs bg-green-600/50 hover:bg-green-600/70 text-green-200 rounded border border-green-500/50 flex items-center justify-center transition-all h-[26px] aspect-square shrink-0"
              title="Add new equipment to database as canonical value">
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Add custom equipment (not in database) */}
          <div className="flex gap-1 flex-1 min-w-[200px] items-center">
            <input
              type="text"
              placeholder="Add custom (JSON only)..."
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
              {filteredEquipment.map((item) => {
                // Get status using displayCode (name) since validationState is keyed by names
                // For mapped equipment, we show raw codes in tooltip but validation is based on name
                const status = getValidationStatus(item.displayCode);
                const isUnknown = status === "unknown";
                const isCustom = status === "custom";
                // For suggestions, we still use the first raw code if available (for mapping flow)
                const firstRawCode = item.rawCodes[0];
                const suggestions = isUnknown ? getSuggestions(firstRawCode) : [];
                
                // Tooltip: If equipment has mapped values, show original raw values (not canonical code)
                const rawCodesTooltip = item.isMapped && item.rawCodes.length > 0
                  ? (() => {
                      // Filter out equipment name itself
                      const mappedValues = item.rawCodes.filter(
                        code => code.toUpperCase() !== item.displayCode.toUpperCase()
                      );
                      
                      // Remove underscore variants if original with spaces/hyphens exists
                      const originals = mappedValues.filter(code => {
                        const hasSpacesOrHyphens = /[\s-]/.test(code);
                        if (hasSpacesOrHyphens) return true; // Keep originals
                        
                        // For underscore variants, only keep if no original exists
                        return !mappedValues.some(other => 
                          other !== code && 
                          /[\s-]/.test(other) &&
                          other.toUpperCase().replace(/[\s-]/g, "_") === code.toUpperCase()
                        );
                      });
                      
                      return originals.length > 0
                        ? `Mapped from: ${originals.join(", ")}`
                        : undefined;
                    })()
                  : undefined;

                return (
                  <div
                    key={item.displayCode}
                    className={`p-1.5 flex items-center justify-between hover:bg-gray-700/50 transition-colors ${
                      isUnknown
                        ? "bg-yellow-500/10"
                        : isCustom
                        ? "bg-purple-500/10"
                        : ""
                    }`}>
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {status === "valid" || isCustom ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-yellow-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div 
                          className="font-mono text-xs font-medium truncate text-gray-200 flex items-center gap-1.5"
                          title={rawCodesTooltip}>
                          <span>{item.displayCode}</span>
                          {item.isMapped && (
                            <span className="text-xs text-blue-400 italic whitespace-nowrap" title={rawCodesTooltip}>
                              (Mapped)
                            </span>
                          )}
                          {isCustom && (
                            <span className="text-xs text-purple-400 italic whitespace-nowrap">
                              Custom (not in database)
                            </span>
                          )}
                        </div>
                        {isUnknown && suggestions.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {suggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => mapEquipment(firstRawCode, suggestion)}
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
                            onClick={() => handleAddToDatabase(firstRawCode)}
                            className="p-0.5 text-green-400 hover:bg-green-500/20 rounded transition-all"
                            title="Add to Database">
                            <Database className="h-3 w-3" />
                          </button>

                          {/* Map to Existing */}
                          <button
                            onClick={() =>
                              setMappingCode(mappingCode === firstRawCode ? null : firstRawCode)
                            }
                            className={`p-0.5 rounded transition-all ${
                              mappingCode === firstRawCode
                                ? "bg-blue-500/30 text-blue-300"
                                : "text-blue-400 hover:bg-blue-500/20"
                            }`}
                            title="Map to Existing">
                            <Link2 className="h-3 w-3" />
                          </button>

                          {/* Add to Trash */}
                          <button
                            onClick={() => handleAddToTrash(firstRawCode)}
                            className="p-0.5 text-orange-400 hover:bg-orange-500/20 rounded transition-all"
                            title="Add to Trash">
                            <Trash2 className="h-3 w-3" />
                          </button>

                          {/* Mark as Custom (add to this JSON only) */}
                          <button
                            onClick={() => markEquipmentAsCustom(firstRawCode)}
                            className="p-0.5 text-purple-400 hover:bg-purple-500/20 rounded transition-all"
                            title="Mark as custom (keep in this JSON only, not saved to database)">
                            <CirclePlus className="h-3 w-3" />
                          </button>
                        </>
                      )}

                      {/* Delete - remove equipment name from array (equipment contains names, not raw codes) */}
                      <button
                        onClick={() => {
                          // Remove using displayCode (name) since equipment array contains names
                          removeEquipment(item.displayCode);
                        }}
                        className="p-0.5 text-red-400 hover:bg-red-500/20 rounded transition-all"
                        title={item.isMapped && item.rawCodes.length > 1 
                          ? `Delete (mapped from: ${item.rawCodes.join(", ")})` 
                          : "Delete"}>
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-hidden"
            onClick={() => {
              setMappingCode(null);
              setMappingSearch("");
              setSelectedEquipmentIds([]);
            }}>
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

              {/* Equipment list with checkboxes for multi-select */}
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
                  .map((eq) => {
                    const isSelected = selectedEquipmentIds.includes(eq.id);
                    return (
                      <button
                        key={eq.id}
                        onClick={() => {
                          // Toggle selection
                          if (isSelected) {
                            setSelectedEquipmentIds(selectedEquipmentIds.filter(id => id !== eq.id));
                          } else {
                            setSelectedEquipmentIds([...selectedEquipmentIds, eq.id]);
                          }
                        }}
                        className={`w-full text-left px-2 py-1 text-xs rounded border transition-all flex items-start gap-2 ${
                          isSelected
                            ? "bg-blue-500/20 border-blue-500 hover:bg-blue-500/30"
                            : "bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-blue-500"
                        }`}>
                        <div className={`mt-0.5 w-3 h-3 rounded border-2 shrink-0 ${
                          isSelected
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-500"
                        }`}>
                          {isSelected && (
                            <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-200 truncate">
                            {eq.name}
                          </div>
                          {eq.category && (
                            <div className="text-xs text-gray-500 truncate">
                              {eq.category}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
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

              <div className="flex justify-between items-center gap-2 pt-2 border-t border-gray-700">
                <div className="text-xs text-gray-400">
                  {selectedEquipmentIds.length > 0 && (
                    <span>{selectedEquipmentIds.length} selected</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setMappingCode(null);
                      setMappingSearch("");
                      setSelectedEquipmentIds([]);
                    }}
                    className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">
                    Cancel
                  </button>
                  {selectedEquipmentIds.length > 0 && (
                    <button
                      onClick={() => {
                        if (mappingCode && selectedEquipmentIds.length > 0) {
                          handleMapToExisting(mappingCode, selectedEquipmentIds);
                        }
                      }}
                      className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                      Save ({selectedEquipmentIds.length})
                    </button>
                  )}
                </div>
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
