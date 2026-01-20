import axios from "axios";
import { API_BASE_URL } from "./api-base-url";

export type EnumType =
  | "body_type"
  | "fuel_type"
  | "drive_type"
  | "transmission_type"
  | "color"
  | "interior_material"
  | "brand"
  | "model"
  | "energy_efficiency"
  | "euro_norm"
  | "currency";

class EnumApi {
  private baseUrl = `${API_BASE_URL}/api/v1/enums`;

  /**
   * Get all enums by type (för dropdowns)
   */
  async getEnumsByType(type: EnumType): Promise<string[]> {
    const response = await axios.get<{ status: string; data: string[] }>(
      `${this.baseUrl}/${type}`
    );
    return response.data.data;
  }

  /**
   * Get MODEL_OPTIONS structure (brand -> models)
   */
  async getModelOptions(): Promise<Record<string, string[]>> {
    const response = await axios.get<{
      status: string;
      data: Record<string, string[]>;
    }>(`${this.baseUrl}/models/options`);
    return response.data.data;
  }

  /**
   * Get models by brand
   */
  async getModelsByBrand(brand: string): Promise<string[]> {
    const response = await axios.get<{ status: string; data: string[] }>(
      `${this.baseUrl}/models/${encodeURIComponent(brand)}`
    );
    return response.data.data;
  }

  /**
   * Create enum
   */
  async createEnum(
    name: string,
    enumType: EnumType,
    parentId?: string
  ): Promise<void> {
    await axios.post(`${this.baseUrl}/`, {
      name,
      enumType,
      parentId,
      source: "manual",
    });
  }

  /**
   * Delete enum
   */
  async deleteEnum(
    name: string,
    enumType: EnumType,
    parentId?: string
  ): Promise<void> {
    const params = parentId ? { parentId } : {};
    await axios.delete(
      `${this.baseUrl}/${enumType}/${encodeURIComponent(name)}`,
      { params }
    );
  }
}

export const enumApi = new EnumApi();
