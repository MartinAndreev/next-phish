export interface GraphTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface GraphEmailAddress {
  emailAddress: {
    address: string;
    name?: string;
  };
}

export interface GraphMessageBody {
  contentType: "HTML" | "Text";
  content: string;
}

export interface GraphAttachment {
  "@odata.type": string;
  name: string;
  contentBytes: string;
  contentType?: string;
}

export interface GraphSendMailPayload {
  message: {
    subject: string;
    body: GraphMessageBody;
    toRecipients: GraphEmailAddress[];
    ccRecipients?: GraphEmailAddress[];
    bccRecipients?: GraphEmailAddress[];
    from?: GraphEmailAddress;
    replyTo?: GraphEmailAddress[];
    attachments?: GraphAttachment[];
    internetMessageHeaders?: Array<{ name: string; value: string }>;
  };
  saveToSentItems?: boolean;
}
