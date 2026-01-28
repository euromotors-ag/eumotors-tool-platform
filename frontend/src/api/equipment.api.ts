import axios from "axios";
import { API_BASE_URL } from "./api-base-url";

export interface Equipment {
  id: string;
  name: string;
  binCategory: "bin_good" | "bin_trash";
  category: string | null; // Funktionell kategori (t.ex. "Safety & Performance", "Comfort", "Technology")
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentValidation {
  name: string;
  isValid: boolean;
  isTrash: boolean;
}

export type EquipmentStatus = "GREEN" | "YELLOW" | "RED";

export interface NormalizedEquipmentItem {
  rawValue: string;
  status: EquipmentStatus;
  canonicalCode?: string;
  canonicalLabel?: string;
  equipmentId?: string;
}

export interface NormalizeEquipmentResult {
  green: NormalizedEquipmentItem[];
  yellow: NormalizedEquipmentItem[];
  red: NormalizedEquipmentItem[];
}

export interface CreateEquipmentDto {
  name: string;
  binCategory: "bin_good" | "bin_trash";
  category?: string; // Funktionell kategori (t.ex. "Safety & Performance", "Comfort", "Technology")
  source?: string;
}

class EquipmentApi {
  private baseUrl = `${API_BASE_URL}/api/v1/equipment`;

  /**
   * Get all equipment by binCategory
   */
  async getEquipmentByCategory(
    category: "bin_good" | "bin_trash"
  ): Promise<Equipment[]> {
    const response = await axios.get<{ status: string; data: Equipment[] }>(
      `${this.baseUrl}/${category}`
    );
    return response.data.data;
  }

  /**
   * Get all "good" equipment as Set (for validation)
   */
  async getGoodEquipmentSet(): Promise<Set<string>> {
    const equipment = await this.getEquipmentByCategory("bin_good");
    return new Set(equipment.map((e) => e.name.toUpperCase()));
  }

  /**
   * Get all "trash" equipment as Set (for filtering)
   */
  async getTrashEquipmentSet(): Promise<Set<string>> {
    const equipment = await this.getEquipmentByCategory("bin_trash");
    return new Set(equipment.map((e) => e.name.toUpperCase()));
  }

  /**
   * Check if equipment exists in database
   */
  async checkEquipment(name: string): Promise<boolean> {
    const response = await axios.get<{ status: string; exists: boolean }>(
      `${this.baseUrl}/check`,
      { params: { name } }
    );
    return response.data.exists;
  }

  /**
   * Check if equipment is in trash
   */
  async checkTrash(name: string): Promise<boolean> {
    const response = await axios.get<{ status: string; isTrash: boolean }>(
      `${this.baseUrl}/trash/check`,
      { params: { name } }
    );
    return response.data.isTrash;
  }

  /**
   * Validate equipment list (batch)
   */
  async validateEquipment(
    equipment: string[]
  ): Promise<EquipmentValidation[]> {
    const response = await axios.post<{
      status: string;
      data: EquipmentValidation[];
    }>(`${this.baseUrl}/validate`, { equipment });
    return response.data.data;
  }

  /**
   * Create equipment
   */
  async createEquipment(dto: CreateEquipmentDto): Promise<Equipment> {
    const response = await axios.post<{ status: string; data: Equipment }>(
      this.baseUrl,
      dto
    );
    return response.data.data;
  }

  /**
   * Update equipment binCategory
   */
  async updateEquipment(
    name: string,
    binCategory: "bin_good" | "bin_trash"
  ): Promise<Equipment> {
    const response = await axios.put<{ status: string; data: Equipment }>(
      `${this.baseUrl}/${encodeURIComponent(name)}`,
      { binCategory }
    );
    return response.data.data;
  }

  /**
   * Delete equipment
   */
  async deleteEquipment(name: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/${encodeURIComponent(name)}`);
  }

  /**
   * Get all equipment categories
   */
  async getEquipmentCategories(): Promise<string[]> {
    const response = await axios.get<{ status: string; data: string[] }>(
      `${this.baseUrl}/categories`
    );
    return response.data.data;
  }

  /**
   * Get equipment by functional category
   */
  async getEquipmentByFunctionalCategory(
    category: string
  ): Promise<Equipment[]> {
    const response = await axios.get<{ status: string; data: Equipment[] }>(
      `${this.baseUrl}/category/${encodeURIComponent(category)}`
    );
    return response.data.data;
  }

  /**
   * Normalize equipment list
   */
  async normalizeEquipment(
    equipment: string[],
    sourceSystem: string,
    carId?: string,
    insertAuditTrail?: boolean
  ): Promise<NormalizeEquipmentResult> {
    const response = await axios.post<{
      status: string;
      data: NormalizeEquipmentResult;
    }>(`${this.baseUrl}/normalize`, {
      equipment,
      sourceSystem,
      carId,
      insertAuditTrail,
    });
    return response.data.data;
  }

  /**
   * Approve unknown equipment as new canonical
   */
  async approveAsNewCanonical(
    rawValue: string,
    sourceSystem: string,
    category?: string,
    code?: string
  ): Promise<NormalizedEquipmentItem> {
    const response = await axios.post<{
      status: string;
      data: NormalizedEquipmentItem;
    }>(`${this.baseUrl}/approve`, {
      rawValue,
      sourceSystem,
      category,
      code,
    });
    return response.data.data;
  }

  /**
   * Map unknown equipment to existing canonical
   * Supports both single mapping (targetEquipmentId) and multi-mapping (targetEquipmentIds)
   */
  async mapToExistingCanonical(
    rawValue: string,
    sourceSystem: string,
    targetEquipmentId: string,
    targetEquipmentIds?: string[]
  ): Promise<NormalizedEquipmentItem> {
    const response = await axios.post<{
      status: string;
      data: NormalizedEquipmentItem;
    }>(`${this.baseUrl}/map`, {
      rawValue,
      sourceSystem,
      targetEquipmentId, // Backward compatibility
      targetEquipmentIds, // Multi-mapping: array of IDs
    });
    return response.data.data;
  }

  /**
   * Mark equipment as trash
   */
  async markAsTrash(
    rawValue: string,
    sourceSystem?: string,
    reason?: string
  ): Promise<NormalizedEquipmentItem> {
    const response = await axios.post<{
      status: string;
      data: NormalizedEquipmentItem;
    }>(`${this.baseUrl}/trash`, {
      rawValue,
      sourceSystem,
      reason,
    });
    return response.data.data;
  }

  /**
   * Get all canonical equipment
   */
  async getAllCanonical(): Promise<
    Array<{ id: string; name: string; code: string | null; category: string | null }>
  > {
    const response = await axios.get<{
      status: string;
      data: Array<{
        id: string;
        name: string;
        code: string | null;
        category: string | null;
      }>;
    }>(`${this.baseUrl}/canonical/all`);
    return response.data.data;
  }

  /**
   * Delete a mapping (undo mapping action)
   */
  async deleteMapping(rawValue: string, sourceSystem: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/map`, {
      data: { rawValue, sourceSystem },
    });
  }

  /**
   * Restore equipment from trash (undo trash action)
   */
  async restoreFromTrash(rawValue: string): Promise<void> {
    await axios.post(`${this.baseUrl}/restore`, { rawValue });
  }

  /**
   * Batch sync equipment changes (ADD, MAP, TRASH)
   */
  async batchSync(changes: Array<{
    id: string;
    type: "ADD" | "MAP" | "TRASH";
    rawValue: string;
    targetValue?: string | string[];
    equipmentId?: string;
    equipmentName?: string;
  }>, sourceSystem?: string, createdBy?: string): Promise<{
    status: "success" | "partial" | "error";
    results: Array<{
      changeId: string;
      success: boolean;
      error?: string;
    }>;
    metrics?: {
      totalChanges: number;
      successfulChanges: number;
      failedChanges: number;
      processingTimeMs: number;
    };
  }> {
    const response = await axios.post<{
      status: string;
      data: {
        status: "success" | "partial" | "error";
        results: Array<{
          changeId: string;
          success: boolean;
          error?: string;
        }>;
        metrics?: {
          totalChanges: number;
          successfulChanges: number;
          failedChanges: number;
          processingTimeMs: number;
        };
      };
    }>(`${this.baseUrl}/batch-sync`, {
      changes,
      sourceSystem: sourceSystem || "json-editor",
      createdBy,
    });
    return response.data.data;
  }
}

export const equipmentApi = new EquipmentApi();
