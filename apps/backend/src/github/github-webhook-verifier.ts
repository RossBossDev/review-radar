import { createHmac, timingSafeEqual } from "node:crypto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GithubWebhookVerifier {
	verify(rawBody: Buffer, signatureHeader: string, secret: string): boolean {
		const expected = this.sign(rawBody, secret);
		const actual = this.parseSignature(signatureHeader);

		if (!actual || actual.length !== expected.length) {
			return false;
		}

		return timingSafeEqual(actual, expected);
	}

	sign(rawBody: Buffer, secret: string): Buffer {
		return createHmac("sha256", secret).update(rawBody).digest();
	}

	formatSignature(rawBody: Buffer, secret: string): string {
		return `sha256=${this.sign(rawBody, secret).toString("hex")}`;
	}

	private parseSignature(signatureHeader: string): Buffer | null {
		const [algorithm, digest] = signatureHeader.split("=", 2);
		if (algorithm !== "sha256" || !digest) {
			return null;
		}

		try {
			return Buffer.from(digest, "hex");
		} catch {
			return null;
		}
	}
}
