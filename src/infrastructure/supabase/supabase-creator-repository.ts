import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "./database.types";
type TypedClient = SupabaseClient<Database>;

import type { CreatorRepository } from "@/application/repositories/creator-repository";
import {
  type ApplicationStatus,
  type BatchSubmission,
  VIDEO_TYPES,
  type Creator,
  type CreatorApplication,
  type CreatorContractSignature,
  type CreatorPayoutProfile,
  type CreatorStatus,
  type MonthlyTracking,
  type PaymentStatus,
  type RushAsset,
  type VideoAsset,
  type VideoRate,
  type VideoStatus,
  type VideoType,
  type VideoTypeCount
} from "@/domain/types";

type CreatorRow = Tables<"creators">;
type MonthlyTrackingRow = Tables<"monthly_tracking">;
type VideoRow = Tables<"videos">;
type RushRow = Tables<"rushes">;
type VideoRateRow = Tables<"video_rates">;
type CreatorApplicationRow = Tables<"creator_applications">;
type CreatorPayoutProfileRow = Tables<"creator_payout_profiles">;
type ContractSignatureRow = Tables<"creator_contract_signatures">;

type BatchRow = {
  id: string;
  monthly_tracking_id: string;
  creator_id: string;
  video_type: string;
  status: string;
  min_clips_required: number;
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
};

function toVideoType(value: string): VideoType {
  const normalized = value.toUpperCase();
  if (!VIDEO_TYPES.includes(normalized as VideoType)) {
    throw new Error(`Unknown video type from database: ${value}`);
  }
  return normalized as VideoType;
}

function toCreatorStatus(value: string): CreatorStatus {
  const allowed: CreatorStatus[] = ["candidat", "actif", "pause", "inactif"];
  if (!allowed.includes(value as CreatorStatus)) {
    throw new Error(`Unknown creator status from database: ${value}`);
  }
  return value as CreatorStatus;
}

function toPaymentStatus(value: string): PaymentStatus {
  const allowed: PaymentStatus[] = ["a_faire", "en_cours", "paye"];
  if (!allowed.includes(value as PaymentStatus)) {
    throw new Error(`Unknown payment status from database: ${value}`);
  }
  return value as PaymentStatus;
}

function toVideoStatus(value: string): VideoStatus {
  const allowed: VideoStatus[] = ["uploaded", "pending_review", "approved", "rejected", "revision_requested"];
  if (!allowed.includes(value as VideoStatus)) {
    throw new Error(`Unknown video status from database: ${value}`);
  }
  return value as VideoStatus;
}

function toApplicationStatus(value: string): ApplicationStatus {
  const allowed: ApplicationStatus[] = ["draft", "pending_review", "approved", "rejected"];
  if (!allowed.includes(value as ApplicationStatus)) {
    throw new Error(`Unknown application status from database: ${value}`);
  }
  return value as ApplicationStatus;
}

function toPayoutMethod(value: string): CreatorPayoutProfile["method"] {
  const allowed: CreatorPayoutProfile["method"][] = ["iban", "paypal"];
  if (!allowed.includes(value as CreatorPayoutProfile["method"])) {
    throw new Error(`Unknown payout method from database: ${value}`);
  }
  return value as CreatorPayoutProfile["method"];
}

function toVideoTypeCount(raw: unknown | null | undefined): VideoTypeCount {
  if (raw !== null && typeof raw !== "object") return {} as VideoTypeCount;
  const input = (raw as Record<string, unknown>) ?? {};

  return VIDEO_TYPES.reduce((acc, type) => {
    const value = input[type];
    const parsed = typeof value === "number" ? value : Number(value ?? 0);
    acc[type] = Number.isFinite(parsed) ? parsed : 0;
    return acc;
  }, {} as VideoTypeCount);
}

function mapCreator(row: CreatorRow): Creator {
  const socialLinks = (
    row.social_links && typeof row.social_links === "object" && !Array.isArray(row.social_links)
      ? row.social_links
      : {}
  ) as Record<string, unknown>;

  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    email: row.email,
    whatsapp: row.whatsapp,
    country: row.country,
    address: row.address,
    followersTiktok: row.followers_tiktok,
    followersInstagram: row.followers_instagram,
    socialLinks: {
      tiktok: typeof socialLinks.tiktok === "string" ? socialLinks.tiktok : undefined,
      instagram: typeof socialLinks.instagram === "string" ? socialLinks.instagram : undefined
    },
    status: toCreatorStatus(row.status),
    startDate: row.start_date,
    contractSignedAt: row.contract_signed_at ?? undefined,
    notes: row.notes ?? undefined,
    kitPromoCode: row.kit_promo_code ?? undefined,
    shopifyDiscountId: row.shopify_discount_id ?? undefined,
    kitOrderPlacedAt: row.kit_order_placed_at ?? undefined,
    shopifyKitOrderId: row.shopify_kit_order_id ?? undefined,
    kitOrderAmount: row.kit_order_amount ?? null,
    kitOrderCurrency: row.kit_order_currency ?? null
  };
}

function mapMonthlyTracking(row: MonthlyTrackingRow): MonthlyTracking {
  return {
    id: row.id,
    month: row.month,
    creatorId: row.creator_id,
    delivered: toVideoTypeCount(row.delivered),
    paymentStatus: toPaymentStatus(row.payment_status),
    paidAt: row.paid_at ?? undefined,
    paidAmount: row.paid_amount ?? null
  };
}

function mapVideo(row: VideoRow & { batch_submission_id?: string | null }): VideoAsset {
  return {
    id: row.id,
    monthlyTrackingId: row.monthly_tracking_id,
    creatorId: row.creator_id,
    videoType: toVideoType(row.video_type),
    fileUrl: row.file_url,
    durationSeconds: row.duration_seconds,
    resolution: row.resolution as VideoAsset["resolution"],
    fileSizeMb: row.file_size_mb,
    status: toVideoStatus(row.status),
    rejectionReason: row.rejection_reason ?? undefined,
    supersededBy: row.superseded_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    createdAt: row.created_at,
    batchSubmissionId: row.batch_submission_id ?? undefined
  };
}

function mapBatch(row: BatchRow): BatchSubmission {
  return {
    id: row.id,
    monthlyTrackingId: row.monthly_tracking_id,
    creatorId: row.creator_id,
    videoType: toVideoType(row.video_type),
    status: toVideoStatus(row.status),
    minClipsRequired: row.min_clips_required,
    rejectionReason: row.rejection_reason ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    createdAt: row.created_at
  };
}

function mapRush(row: RushRow): RushAsset {
  return {
    id: row.id,
    monthlyTrackingId: row.monthly_tracking_id,
    creatorId: row.creator_id,
    fileName: row.file_name,
    fileSizeMb: row.file_size_mb,
    fileUrl: row.file_url ?? undefined,
    createdAt: row.created_at
  };
}

function mapCreatorApplication(row: CreatorApplicationRow): CreatorApplication {
  return {
    id: row.id,
    userId: row.user_id,
    status: toApplicationStatus(row.status),
    handle: row.handle,
    fullName: row.full_name,
    email: row.email,
    whatsapp: row.whatsapp,
    country: row.country,
    address: row.address,
    socialTiktok: row.social_tiktok ?? undefined,
    socialInstagram: row.social_instagram ?? undefined,
    followersTiktok: row.followers_tiktok,
    followersInstagram: row.followers_instagram,
    submittedAt: row.submitted_at ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewNotes: row.review_notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapPayoutProfile(row: CreatorPayoutProfileRow): CreatorPayoutProfile {
  return {
    creatorId: row.creator_id,
    method: toPayoutMethod(row.method),
    accountHolderName: row.account_holder_name,
    iban: row.iban,
    paypalEmail: row.paypal_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapContractSignature(row: ContractSignatureRow): CreatorContractSignature {
  const acceptance: Record<string, boolean> = {};
  const acceptanceRaw = (
    row.acceptance && typeof row.acceptance === "object" && !Array.isArray(row.acceptance)
      ? row.acceptance
      : {}
  ) as Record<string, unknown>;
  for (const [key, value] of Object.entries(acceptanceRaw)) {
    if (typeof value === "boolean") {
      acceptance[key] = value;
    }
  }

  return {
    id: row.id,
    creatorId: row.creator_id,
    userId: row.user_id,
    contractVersion: row.contract_version,
    contractChecksum: row.contract_checksum,
    signerName: row.signer_name,
    acceptance,
    ip: typeof row.ip === "string" ? row.ip : null,
    userAgent: row.user_agent,
    signedAt: row.signed_at,
    createdAt: row.created_at
  };
}

// Explicit column selections to avoid select("*") over-fetching (H-03).
const CREATOR_COLS =
  "id,user_id,handle,display_name,email,whatsapp,country,address,followers_tiktok,followers_instagram,social_links,status,start_date,contract_signed_at,notes,kit_promo_code,shopify_discount_id,kit_order_placed_at,shopify_kit_order_id,kit_order_amount,kit_order_currency" as const;
const TRACKING_COLS = "id,month,creator_id,delivered,payment_status,paid_at,paid_amount" as const;
const VIDEO_COLS =
  "id,monthly_tracking_id,creator_id,video_type,file_url,duration_seconds,resolution,file_size_mb,status,rejection_reason,superseded_by,reviewed_at,reviewed_by,created_at,batch_submission_id" as const;
const RUSH_COLS =
  "id,monthly_tracking_id,creator_id,file_name,file_size_mb,file_url,created_at" as const;
const RATE_COLS = "video_type,rate_per_video,is_placeholder" as const;
const APPLICATION_COLS =
  "id,user_id,status,handle,full_name,email,whatsapp,country,address,social_tiktok,social_instagram,followers_tiktok,followers_instagram,submitted_at,reviewed_at,review_notes,created_at,updated_at" as const;
const PAYOUT_COLS =
  "creator_id,method,account_holder_name,iban,paypal_email,created_at,updated_at" as const;
const BATCH_COLS =
  "id,monthly_tracking_id,creator_id,video_type,status,min_clips_required,rejection_reason,reviewed_at,reviewed_by,created_at" as const;

/** Safety limit for unbounded list queries to prevent OOM at scale (H-04). */
const LIST_LIMIT = 1000;

export class SupabaseCreatorRepository implements CreatorRepository {
  constructor(private readonly client: TypedClient) {}

  async listCreators(): Promise<Creator[]> {
    const { data, error } = await this.client
      .from("creators")
      .select(CREATOR_COLS)
      .order("created_at", { ascending: true })
      .limit(LIST_LIMIT);

    if (error) {
      throw new Error(`Failed to list creators: ${error.message}`);
    }

    return (data as CreatorRow[]).map(mapCreator);
  }

  async getCreatorById(creatorId: string): Promise<Creator | null> {
    const { data, error } = await this.client
      .from("creators")
      .select(CREATOR_COLS)
      .eq("id", creatorId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get creator ${creatorId}: ${error.message}`);
    }

    return data ? mapCreator(data as CreatorRow) : null;
  }

  async listMonthlyTrackings(month?: string): Promise<MonthlyTracking[]> {
    let query = this.client
      .from("monthly_tracking")
      .select(TRACKING_COLS)
      .order("month", { ascending: false })
      .limit(LIST_LIMIT);

    if (month) {
      query = query.eq("month", month);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list monthly tracking: ${error.message}`);
    }

    return (data as MonthlyTrackingRow[]).map(mapMonthlyTracking);
  }

  async getMonthlyTracking(creatorId: string, month: string): Promise<MonthlyTracking | null> {
    const { data, error } = await this.client
      .from("monthly_tracking")
      .select(TRACKING_COLS)
      .eq("creator_id", creatorId)
      .eq("month", month)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get monthly tracking for ${creatorId}/${month}: ${error.message}`);
    }

    return data ? mapMonthlyTracking(data as MonthlyTrackingRow) : null;
  }

  async getMonthlyTrackingById(monthlyTrackingId: string): Promise<MonthlyTracking | null> {
    const { data, error } = await this.client
      .from("monthly_tracking")
      .select(TRACKING_COLS)
      .eq("id", monthlyTrackingId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get monthly tracking ${monthlyTrackingId}: ${error.message}`);
    }

    return data ? mapMonthlyTracking(data as MonthlyTrackingRow) : null;
  }

  async listCreatorTrackings(creatorId: string): Promise<MonthlyTracking[]> {
    const { data, error } = await this.client
      .from("monthly_tracking")
      .select(TRACKING_COLS)
      .eq("creator_id", creatorId)
      .order("month", { ascending: false })
      .limit(LIST_LIMIT);

    if (error) {
      throw new Error(`Failed to list creator trackings for ${creatorId}: ${error.message}`);
    }

    return (data as MonthlyTrackingRow[]).map(mapMonthlyTracking);
  }

  async getVideoById(videoId: string): Promise<VideoAsset | null> {
    const { data, error } = await this.client
      .from("videos")
      .select(VIDEO_COLS)
      .eq("id", videoId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get video ${videoId}: ${error.message}`);
    }

    return data ? mapVideo(data as VideoRow) : null;
  }

  async listVideosByStatus(status: VideoStatus): Promise<VideoAsset[]> {
    const { data, error } = await this.client
      .from("videos")
      .select(VIDEO_COLS)
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT);

    if (error) {
      throw new Error(`Failed to list videos by status ${status}: ${error.message}`);
    }

    return (data as VideoRow[]).map(mapVideo);
  }

  async listVideosByTracking(monthlyTrackingId: string): Promise<VideoAsset[]> {
    const { data, error } = await this.client
      .from("videos")
      .select(VIDEO_COLS)
      .eq("monthly_tracking_id", monthlyTrackingId)
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT);

    if (error) {
      throw new Error(`Failed to list videos by tracking ${monthlyTrackingId}: ${error.message}`);
    }

    return (data as VideoRow[]).map(mapVideo);
  }

  async listRushesByTracking(monthlyTrackingId: string): Promise<RushAsset[]> {
    const { data, error } = await this.client
      .from("rushes")
      .select(RUSH_COLS)
      .eq("monthly_tracking_id", monthlyTrackingId)
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT);

    if (error) {
      throw new Error(`Failed to list rushes by tracking ${monthlyTrackingId}: ${error.message}`);
    }

    return (data as RushRow[]).map(mapRush);
  }

  async createRushAsset(input: {
    monthlyTrackingId: string;
    creatorId: string;
    fileName: string;
    fileSizeMb: number;
    fileUrl?: string | null;
  }): Promise<RushAsset> {
    const { data, error } = await this.client
      .from("rushes")
      .insert({
        monthly_tracking_id: input.monthlyTrackingId,
        creator_id: input.creatorId,
        file_name: input.fileName,
        file_size_mb: input.fileSizeMb,
        file_url: input.fileUrl ?? null
      })
      .select(RUSH_COLS)
      .single();

    if (error) {
      throw new Error(`Failed to create rush asset: ${error.message}`);
    }

    return mapRush(data as RushRow);
  }

  async createVideoAsset(input: {
    monthlyTrackingId: string;
    creatorId: string;
    videoType: VideoAsset["videoType"];
    fileUrl: string;
    durationSeconds: number;
    resolution: VideoAsset["resolution"];
    fileSizeMb: number;
    status?: VideoStatus;
    supersededBy?: string;
  }): Promise<VideoAsset> {
    const { data, error } = await this.client
      .from("videos")
      .insert({
        monthly_tracking_id: input.monthlyTrackingId,
        creator_id: input.creatorId,
        video_type: input.videoType,
        file_url: input.fileUrl,
        duration_seconds: input.durationSeconds,
        resolution: input.resolution,
        file_size_mb: input.fileSizeMb,
        status: input.status ?? "pending_review",
        superseded_by: input.supersededBy ?? null
      })
      .select(VIDEO_COLS)
      .single();

    if (error) {
      throw new Error(`Failed to create video asset: ${error.message}`);
    }

    return mapVideo(data as VideoRow);
  }

  async markVideoSuperseded(input: {
    videoId: string;
    supersededById: string;
  }): Promise<VideoAsset> {
    const { data, error } = await this.client
      .from("videos")
      .update({ superseded_by: input.supersededById })
      .eq("id", input.videoId)
      .select(VIDEO_COLS)
      .maybeSingle();

    if (error || !data) {
      throw new Error(
        `Failed to mark video ${input.videoId} superseded: ${error?.message ?? "missing row"}`
      );
    }

    return mapVideo(data as VideoRow);
  }

  async reviewVideoAsset(input: {
    videoId: string;
    status: Extract<VideoStatus, "approved" | "rejected" | "revision_requested">;
    rejectionReason?: string | null;
    reviewedBy: string;
  }): Promise<VideoAsset> {
    const { data, error } = await this.client
      .from("videos")
      .update({
        status: input.status,
        rejection_reason: input.status !== "approved" ? (input.rejectionReason ?? null) : null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: input.reviewedBy
      })
      .eq("id", input.videoId)
      .select(VIDEO_COLS)
      .maybeSingle();

    if (error || !data) {
      throw new Error(
        `Failed to review video ${input.videoId}: ${error?.message ?? "missing row"}`
      );
    }

    return mapVideo(data as VideoRow);
  }

  async reviewVideoAndUpdateTracking(input: {
    videoId: string;
    status: Extract<VideoStatus, "approved" | "rejected" | "revision_requested">;
    rejectionReason?: string | null;
    reviewedBy: string;
  }): Promise<{ video: VideoAsset; tracking: MonthlyTracking }> {
    const { data, error } = await this.client.rpc("review_video_and_update_tracking", {
      p_video_id: input.videoId,
      p_status: input.status,
      p_rejection_reason:
        input.status !== "approved" ? (input.rejectionReason ?? undefined) : undefined,
      p_reviewed_by: input.reviewedBy
    });

    if (error) {
      throw new Error(`Failed to review video atomically ${input.videoId}: ${error.message}`);
    }

    const result = data as { video: VideoRow; tracking: MonthlyTrackingRow };
    return {
      video: mapVideo(result.video),
      tracking: mapMonthlyTracking(result.tracking)
    };
  }

  async updateTrackingDelivered(input: {
    monthlyTrackingId: string;
    delivered: MonthlyTracking["delivered"];
  }): Promise<MonthlyTracking> {
    const { data, error } = await this.client
      .from("monthly_tracking")
      .update({
        delivered: input.delivered
      })
      .eq("id", input.monthlyTrackingId)
      .select(TRACKING_COLS)
      .maybeSingle();

    if (error || !data) {
      throw new Error(
        `Failed to update tracking delivered for ${input.monthlyTrackingId}: ${error?.message ?? "missing row"}`
      );
    }

    return mapMonthlyTracking(data as MonthlyTrackingRow);
  }

  async markMonthlyTrackingPaid(input: {
    monthlyTrackingId: string;
    paidAt?: string | null;
    paidAmount?: number | null;
  }): Promise<MonthlyTracking> {
    const paidAt = input.paidAt ?? new Date().toISOString();

    const { data, error } = await this.client
      .from("monthly_tracking")
      .update({
        payment_status: "paye",
        paid_at: paidAt,
        paid_amount: input.paidAmount ?? null
      })
      .eq("id", input.monthlyTrackingId)
      .select(TRACKING_COLS)
      .maybeSingle();

    if (error || !data) {
      throw new Error(
        `Failed to mark tracking paid for ${input.monthlyTrackingId}: ${error?.message ?? "missing row"}`
      );
    }

    return mapMonthlyTracking(data as MonthlyTrackingRow);
  }

  async getPayoutProfileByCreatorId(creatorId: string): Promise<CreatorPayoutProfile | null> {
    const { data, error } = await this.client
      .from("creator_payout_profiles")
      .select(PAYOUT_COLS)
      .eq("creator_id", creatorId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get payout profile for ${creatorId}: ${error.message}`);
    }

    return data ? mapPayoutProfile(data as CreatorPayoutProfileRow) : null;
  }

  async listPayoutProfiles(): Promise<CreatorPayoutProfile[]> {
    const { data, error } = await this.client
      .from("creator_payout_profiles")
      .select(PAYOUT_COLS)
      .limit(LIST_LIMIT);

    if (error) {
      throw new Error(`Failed to list payout profiles: ${error.message}`);
    }

    return (data as CreatorPayoutProfileRow[]).map(mapPayoutProfile);
  }

  async upsertPayoutProfile(input: {
    creatorId: string;
    method: CreatorPayoutProfile["method"];
    accountHolderName?: string | null;
    iban?: string | null;
    paypalEmail?: string | null;
  }): Promise<CreatorPayoutProfile> {
    const { data, error } = await this.client
      .from("creator_payout_profiles")
      .upsert(
        {
          creator_id: input.creatorId,
          method: input.method,
          account_holder_name: input.accountHolderName ?? null,
          iban: input.iban ?? null,
          paypal_email: input.paypalEmail ?? null
        },
        { onConflict: "creator_id" }
      )
      .select(PAYOUT_COLS)
      .single();

    if (error) {
      throw new Error(`Failed to upsert payout profile for ${input.creatorId}: ${error.message}`);
    }

    return mapPayoutProfile(data as CreatorPayoutProfileRow);
  }

  async listContractSignaturesByCreatorId(creatorId: string): Promise<CreatorContractSignature[]> {
    const { data, error } = await this.client
      .from("creator_contract_signatures")
      .select(
        "id,creator_id,user_id,contract_version,contract_checksum,signer_name,acceptance,ip,user_agent,signed_at,created_at"
      )
      .eq("creator_id", creatorId)
      .order("signed_at", { ascending: false })
      .limit(LIST_LIMIT);

    if (error) {
      throw new Error(`Failed to list contract signatures for ${creatorId}: ${error.message}`);
    }

    return (data as ContractSignatureRow[]).map(mapContractSignature);
  }

  async listRates(): Promise<VideoRate[]> {
    const { data, error } = await this.client
      .from("video_rates")
      .select(RATE_COLS)
      .order("video_type", { ascending: true });

    if (error) {
      throw new Error(`Failed to list video rates: ${error.message}`);
    }

    return (data as VideoRateRow[]).map((row) => ({
      videoType: toVideoType(row.video_type),
      ratePerVideo: Number(row.rate_per_video),
      isPlaceholder: row.is_placeholder ?? false
    }));
  }

  async updateVideoRate(input: { videoType: VideoType; ratePerVideo: number }): Promise<VideoRate> {
    const { data, error } = await this.client
      .from("video_rates")
      .update({
        rate_per_video: input.ratePerVideo,
        is_placeholder: false
      })
      .eq("video_type", input.videoType)
      .select(RATE_COLS)
      .single();

    if (error) {
      throw new Error(`Failed to update video rate ${input.videoType}: ${error.message}`);
    }

    const row = data as VideoRateRow;
    return {
      videoType: toVideoType(row.video_type),
      ratePerVideo: Number(row.rate_per_video),
      isPlaceholder: row.is_placeholder ?? false
    };
  }

  async deleteVideoRate(input: { videoType: VideoType }): Promise<VideoRate> {
    const { data, error } = await this.client
      .from("video_rates")
      .update({
        is_placeholder: true
      })
      .eq("video_type", input.videoType)
      .select(RATE_COLS)
      .maybeSingle();

    if (error || !data) {
      throw new Error(
        `Failed to disable video rate ${input.videoType}: ${error?.message ?? "missing row"}`
      );
    }

    const row = data as VideoRateRow;
    return {
      videoType: toVideoType(row.video_type),
      ratePerVideo: Number(row.rate_per_video),
      isPlaceholder: row.is_placeholder ?? false
    };
  }

  async listCreatorApplications(status?: ApplicationStatus): Promise<CreatorApplication[]> {
    let query = this.client
      .from("creator_applications")
      .select(APPLICATION_COLS)
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list creator applications: ${error.message}`);
    }

    return (data as CreatorApplicationRow[]).map(mapCreatorApplication);
  }

  async getCreatorApplicationByUserId(userId: string): Promise<CreatorApplication | null> {
    const { data, error } = await this.client
      .from("creator_applications")
      .select(APPLICATION_COLS)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get creator application for ${userId}: ${error.message}`);
    }

    return data ? mapCreatorApplication(data as CreatorApplicationRow) : null;
  }

  async upsertCreatorApplication(input: {
    userId: string;
    handle: string;
    fullName: string;
    email: string;
    whatsapp: string;
    country: string;
    address: string;
    socialTiktok?: string;
    socialInstagram?: string;
    followersTiktok: number;
    followersInstagram: number;
    submit: boolean;
  }): Promise<CreatorApplication> {
    const nowIso = new Date().toISOString();
    const row = {
      user_id: input.userId,
      handle: input.handle,
      full_name: input.fullName,
      email: input.email,
      whatsapp: input.whatsapp,
      country: input.country,
      address: input.address,
      social_tiktok: input.socialTiktok ?? null,
      social_instagram: input.socialInstagram ?? null,
      followers_tiktok: input.followersTiktok,
      followers_instagram: input.followersInstagram,
      status: input.submit ? "pending_review" : "draft",
      submitted_at: input.submit ? nowIso : null
    };

    const { data, error } = await this.client
      .from("creator_applications")
      .upsert(row, { onConflict: "user_id" })
      .select(APPLICATION_COLS)
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to upsert creator application for ${input.userId}: ${error?.message ?? "missing row"}`
      );
    }

    return mapCreatorApplication(data as CreatorApplicationRow);
  }

  async reviewCreatorApplication(input: {
    userId: string;
    status: Exclude<ApplicationStatus, "draft" | "pending_review">;
    reviewNotes?: string | null;
  }): Promise<CreatorApplication> {
    const { data, error } = await this.client
      .from("creator_applications")
      .update({
        status: input.status,
        reviewed_at: new Date().toISOString(),
        review_notes: input.reviewNotes ?? null
      })
      .eq("user_id", input.userId)
      .select(APPLICATION_COLS)
      .maybeSingle();

    if (error || !data) {
      throw new Error(
        `Failed to review creator application for ${input.userId}: ${error?.message ?? "missing row"}`
      );
    }

    return mapCreatorApplication(data as CreatorApplicationRow);
  }

  async getCreatorByUserId(userId: string): Promise<Creator | null> {
    const { data, error } = await this.client
      .from("creators")
      .select(CREATOR_COLS)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get creator by user_id ${userId}: ${error.message}`);
    }

    return data ? mapCreator(data as CreatorRow) : null;
  }

  async updateCreatorStatus(input: {
    creatorId: string;
    status: Extract<Creator["status"], "actif" | "pause" | "inactif">;
  }): Promise<Creator> {
    const { data, error } = await this.client
      .from("creators")
      .update({ status: input.status })
      .eq("id", input.creatorId)
      .select(CREATOR_COLS)
      .maybeSingle();

    if (error || !data) {
      throw new Error(
        `Failed to update creator status ${input.creatorId}: ${error?.message ?? "missing row"}`
      );
    }

    return mapCreator(data as CreatorRow);
  }

  async upsertCreatorFromApplication(input: {
    application: CreatorApplication;
    status: "actif" | "candidat";
    startDate: string;
  }): Promise<Creator> {
    const normalizedEmail = input.application.email.trim().toLowerCase();

    const creatorPayload = {
      user_id: input.application.userId,
      handle: input.application.handle,
      display_name: input.application.fullName,
      email: normalizedEmail,
      whatsapp: input.application.whatsapp,
      country: input.application.country,
      address: input.application.address,
      followers_tiktok: input.application.followersTiktok,
      followers_instagram: input.application.followersInstagram,
      social_links: {
        ...(input.application.socialTiktok ? { tiktok: input.application.socialTiktok } : {}),
        ...(input.application.socialInstagram
          ? { instagram: input.application.socialInstagram }
          : {})
      },
      status: input.status,
      start_date: input.startDate
    };

    const { data: existingByUserId, error: byUserIdError } = await this.client
      .from("creators")
      .select(CREATOR_COLS)
      .eq("user_id", input.application.userId)
      .maybeSingle();

    if (byUserIdError) {
      throw new Error(`Failed to resolve creator mapping: ${byUserIdError.message}`);
    }

    if (existingByUserId) {
      const { data: updated, error: updateError } = await this.client
        .from("creators")
        .update({
          handle: creatorPayload.handle,
          display_name: creatorPayload.display_name,
          email: creatorPayload.email,
          whatsapp: creatorPayload.whatsapp,
          country: creatorPayload.country,
          address: creatorPayload.address,
          followers_tiktok: creatorPayload.followers_tiktok,
          followers_instagram: creatorPayload.followers_instagram,
          social_links: creatorPayload.social_links,
          status: creatorPayload.status
        })
        .eq("id", (existingByUserId as CreatorRow).id)
        .select(CREATOR_COLS)
        .maybeSingle();

      if (updateError || !updated) {
        throw new Error(
          `Failed to update creator from application: ${updateError?.message ?? "missing row"}`
        );
      }

      return mapCreator(updated as CreatorRow);
    }

    const { data: existingByEmail, error: byEmailError } = await this.client
      .from("creators")
      .select(CREATOR_COLS)
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (byEmailError) {
      throw new Error(`Failed to resolve creator email mapping: ${byEmailError.message}`);
    }

    if (existingByEmail) {
      const { data: updated, error: updateError } = await this.client
        .from("creators")
        .update({
          ...creatorPayload
        })
        .eq("id", (existingByEmail as CreatorRow).id)
        .select(CREATOR_COLS)
        .maybeSingle();

      if (updateError || !updated) {
        throw new Error(
          `Failed to attach creator to user: ${updateError?.message ?? "missing row"}`
        );
      }

      return mapCreator(updated as CreatorRow);
    }

    const { data, error } = await this.client
      .from("creators")
      .insert(creatorPayload)
      .select(CREATOR_COLS)
      .single();

    if (error) {
      throw new Error(`Failed to create creator from application: ${error.message}`);
    }

    return mapCreator(data as CreatorRow);
  }

  async createMonthlyTracking(input: {
    creatorId: string;
    month: string;
    delivered: MonthlyTracking["delivered"];
  }): Promise<MonthlyTracking> {
    const { data, error } = await this.client
      .from("monthly_tracking")
      .upsert(
        {
          month: input.month,
          creator_id: input.creatorId,
          delivered: input.delivered,
          payment_status: "en_cours"
        },
        { onConflict: "month,creator_id" }
      )
      .select(TRACKING_COLS)
      .single();

    if (error) {
      throw new Error(`Failed to create monthly tracking: ${error.message}`);
    }

    return mapMonthlyTracking(data as MonthlyTrackingRow);
  }

  async getCreatorByKitPromoCode(code: string): Promise<Creator | null> {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return null;

    const { data, error } = await this.client
      .from("creators")
      .select(CREATOR_COLS)
      .ilike("kit_promo_code", normalized)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get creator by kit promo code: ${error.message}`);
    }

    return data ? mapCreator(data as CreatorRow) : null;
  }

  async updateKitPromoCode(input: {
    creatorId: string;
    kitPromoCode: string;
    shopifyDiscountId: string;
  }): Promise<Creator> {
    const { data, error } = await this.client
      .from("creators")
      .update({
        kit_promo_code: input.kitPromoCode,
        shopify_discount_id: input.shopifyDiscountId
      })
      .eq("id", input.creatorId)
      .select(CREATOR_COLS)
      .maybeSingle();

    if (error || !data) {
      throw new Error(
        `Failed to update kit promo code for ${input.creatorId}: ${error?.message ?? "missing row"}`
      );
    }

    return mapCreator(data as CreatorRow);
  }

  async markKitOrdered(input: {
    creatorId: string;
    kitOrderPlacedAt: string;
    shopifyKitOrderId: string;
    orderAmount?: number | null;
    orderCurrency?: string | null;
  }): Promise<Creator> {
    const { data, error } = await this.client
      .from("creators")
      .update({
        kit_order_placed_at: input.kitOrderPlacedAt,
        shopify_kit_order_id: input.shopifyKitOrderId,
        kit_order_amount: input.orderAmount ?? null,
        kit_order_currency: input.orderCurrency ?? null
      })
      .eq("id", input.creatorId)
      .select(CREATOR_COLS)
      .maybeSingle();

    if (error || !data) {
      throw new Error(
        `Failed to mark kit ordered for ${input.creatorId}: ${error?.message ?? "missing row"}`
      );
    }

    return mapCreator(data as CreatorRow);
  }

  async recordShopifyWebhookOnce(input: {
    webhookId: string;
    topic: string;
    shopDomain?: string | null;
    creatorId?: string | null;
  }): Promise<boolean> {
    const { error } = await this.client.from("shopify_webhook_events").insert({
      webhook_id: input.webhookId,
      topic: input.topic,
      shop_domain: input.shopDomain ?? null,
      creator_id: input.creatorId ?? null
    });

    if (!error) return true;

    // PostgreSQL unique violation code = 23505.
    const code = (error as { code?: string }).code;
    if (code === "23505") return false;

    throw new Error(`Failed to record Shopify webhook: ${error.message}`);
  }

  async rollbackShopifyWebhook(webhookId: string): Promise<void> {
    const { error } = await this.client
      .from("shopify_webhook_events")
      .delete()
      .eq("webhook_id", webhookId);

    if (error) {
      throw new Error(`Failed to rollback Shopify webhook ${webhookId}: ${error.message}`);
    }
  }

  async signContract(input: {
    creatorId: string;
    userId: string;
    contractVersion: string;
    contractChecksum: string;
    contractText: string;
    signerName: string;
    acceptance: Record<string, boolean>;
    ip: string | null;
    userAgent: string | null;
    signedAt: string;
  }): Promise<{
    signatureId: string;
    signedAt: string;
    contractSignedAt: string;
    wasFirstTimeSigning: boolean;
  }> {
    // Snapshot previous contract_signed_at to know whether this signing is a first-time.
    const before = await this.client
      .from("creators")
      .select("contract_signed_at")
      .eq("id", input.creatorId)
      .maybeSingle();

    if (before.error) {
      throw new Error(`Failed to load creator before signing: ${before.error.message}`);
    }
    const wasFirstTimeSigning = !before.data?.contract_signed_at;

    const upsert = await this.client
      .from("creator_contract_signatures")
      .upsert(
        {
          creator_id: input.creatorId,
          user_id: input.userId,
          contract_version: input.contractVersion,
          contract_checksum: input.contractChecksum,
          contract_text: input.contractText,
          signer_name: input.signerName,
          acceptance: input.acceptance,
          ip: input.ip,
          user_agent: input.userAgent,
          signed_at: input.signedAt
        },
        { onConflict: "user_id,contract_checksum", ignoreDuplicates: true }
      )
      .select("id, signed_at")
      .maybeSingle();

    if (upsert.error) {
      throw new Error(`Failed to record contract signature: ${upsert.error.message}`);
    }

    let signatureId = upsert.data?.id ?? null;
    let signedAt = upsert.data?.signed_at ?? input.signedAt;

    if (!signatureId) {
      const existing = await this.client
        .from("creator_contract_signatures")
        .select("id, signed_at")
        .eq("user_id", input.userId)
        .eq("contract_checksum", input.contractChecksum)
        .order("signed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing.error) {
        throw new Error(
          `Failed to reload existing contract signature: ${existing.error.message}`
        );
      }
      signatureId = existing.data?.id ?? null;
      signedAt = existing.data?.signed_at ?? signedAt;
    }

    if (!signatureId) {
      throw new Error("Contract signature row missing after upsert");
    }

    const updateCreator = await this.client
      .from("creators")
      .update({ contract_signed_at: signedAt })
      .eq("id", input.creatorId)
      .select("contract_signed_at")
      .maybeSingle();

    if (updateCreator.error || !updateCreator.data) {
      throw new Error(
        `Failed to finalize contract signature: ${updateCreator.error?.message ?? "missing row"}`
      );
    }

    return {
      signatureId,
      signedAt,
      contractSignedAt: updateCreator.data.contract_signed_at ?? signedAt,
      wasFirstTimeSigning
    };
  }

  async clearKitPromoCode(creatorId: string): Promise<Creator> {
    const { data, error } = await this.client
      .from("creators")
      .update({
        kit_promo_code: null,
        shopify_discount_id: null
      })
      .eq("id", creatorId)
      .select(CREATOR_COLS)
      .maybeSingle();

    if (error || !data) {
      throw new Error(
        `Failed to clear kit promo code for ${creatorId}: ${error?.message ?? "missing row"}`
      );
    }

    return mapCreator(data as CreatorRow);
  }

  // ── Batch submissions ────────────────────────────────────────────────────

  async createBatchSubmission(input: {
    monthlyTrackingId: string;
    creatorId: string;
    videoType: import("@/domain/types").VideoType;
    minClipsRequired: number;
  }): Promise<import("@/domain/types").BatchSubmission> {
    const { data, error } = await this.client
      .from("batch_submissions")
      .insert({
        monthly_tracking_id: input.monthlyTrackingId,
        creator_id: input.creatorId,
        video_type: input.videoType,
        min_clips_required: input.minClipsRequired,
        status: "pending_review"
      })
      .select(BATCH_COLS)
      .single();

    if (error || !data) {
      throw new Error(`Failed to create batch submission: ${error?.message ?? "missing row"}`);
    }

    return mapBatch(data);
  }

  async getBatchSubmissionById(
    batchId: string
  ): Promise<import("@/domain/types").BatchSubmission | null> {
    const { data, error } = await this.client
      .from("batch_submissions")
      .select(BATCH_COLS)
      .eq("id", batchId)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch batch submission: ${error.message}`);
    return data ? mapBatch(data) : null;
  }

  async addClipToBatch(input: {
    batchSubmissionId: string;
    monthlyTrackingId: string;
    creatorId: string;
    videoType: import("@/domain/types").VideoType;
    fileUrl: string;
    fileSizeMb: number;
  }): Promise<VideoAsset> {
    const { data, error } = await this.client
      .from("videos")
      .insert({
        monthly_tracking_id: input.monthlyTrackingId,
        creator_id: input.creatorId,
        video_type: input.videoType,
        file_url: input.fileUrl,
        file_size_mb: input.fileSizeMb,
        duration_seconds: 0,
        resolution: "1080x1920",
        status: "uploaded",
        batch_submission_id: input.batchSubmissionId
      })
      .select(VIDEO_COLS)
      .single();

    if (error || !data) {
      throw new Error(`Failed to add clip to batch: ${error?.message ?? "missing row"}`);
    }

    return mapVideo(data as VideoRow & { batch_submission_id?: string | null });
  }

  async listBatchSubmissionsByStatus(
    status: import("@/domain/types").VideoStatus
  ): Promise<import("@/domain/types").BatchSubmission[]> {
    const { data, error } = await this.client
      .from("batch_submissions")
      .select(BATCH_COLS)
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT);

    if (error) throw new Error(`Failed to list batch submissions by status: ${error.message}`);
    return (data ?? []).map(mapBatch);
  }

  async listBatchSubmissionsByTracking(
    monthlyTrackingId: string
  ): Promise<import("@/domain/types").BatchSubmission[]> {
    const { data, error } = await this.client
      .from("batch_submissions")
      .select(BATCH_COLS)
      .eq("monthly_tracking_id", monthlyTrackingId)
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT);

    if (error) {
      throw new Error(`Failed to list batch submissions by tracking: ${error.message}`);
    }
    return (data ?? []).map(mapBatch);
  }

  async reviewBatchAndUpdateTracking(input: {
    batchId: string;
    status: Extract<import("@/domain/types").VideoStatus, "approved" | "rejected" | "revision_requested">;
    rejectionReason?: string | null;
    reviewedBy: string;
  }): Promise<{ batch: import("@/domain/types").BatchSubmission; tracking: MonthlyTracking }> {
    const { data, error } = await this.client.rpc("review_batch_and_update_tracking", {
      p_batch_id: input.batchId,
      p_status: input.status,
      p_rejection_reason: input.rejectionReason ?? null,
      p_reviewed_by: input.reviewedBy
    });

    if (error) throw new Error(`Failed to review batch: ${error.message}`);

    const result = data as { batch: Record<string, unknown>; tracking: Record<string, unknown> };
    return {
      batch: mapBatch(result.batch as BatchRow),
      tracking: mapMonthlyTracking(result.tracking as MonthlyTrackingRow)
    };
  }
}
