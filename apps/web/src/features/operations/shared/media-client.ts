export type PersistedAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
};

const API_URL = import.meta.env.VITE_API_URL || "";

async function parseJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

export async function uploadCustomerAvatar(customerId: string, file: File) {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${API_URL}/api/operations/customers/${customerId}/avatar`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    throw (await parseJson(response)) ?? new Error("Failed to upload customer avatar");
  }

  return (await response.json()) as PersistedAttachment;
}

export async function uploadServicePhotos(serviceId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("photos", file);
  });

  const response = await fetch(`${API_URL}/api/operations/services/${serviceId}/photos`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    throw (await parseJson(response)) ?? new Error("Failed to upload service photos");
  }

  return (await response.json()) as PersistedAttachment[];
}

export async function deleteCustomerAvatar(customerId: string, attachmentId: string) {
  const response = await fetch(
    `${API_URL}/api/operations/customers/${customerId}/avatar?attachmentId=${attachmentId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw (await parseJson(response)) ?? new Error("Failed to delete customer avatar");
  }

  return (await response.json()) as { success: boolean };
}

export async function deleteServicePhoto(serviceId: string, attachmentId: string) {
  const response = await fetch(
    `${API_URL}/api/operations/services/${serviceId}/photos?attachmentId=${attachmentId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw (await parseJson(response)) ?? new Error("Failed to delete service photo");
  }

  return (await response.json()) as { success: boolean };
}
