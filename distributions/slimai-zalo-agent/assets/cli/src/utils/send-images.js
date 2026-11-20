/** Send images with an optional separate text message, preserving partial results. */
export async function sendImages(api, { paths, caption = "", separateCaption = false }, threadId, type) {
    if (!separateCaption || !caption) {
        return api.sendMessage({ msg: caption, attachments: paths }, threadId, type);
    }

    const textResult = await api.sendMessage(caption, threadId, type);
    if (!textResult?.message?.msgId) {
        const failure = new Error(
            "Text delivery is unverified: Zalo returned no message ID. Check the conversation before retrying.",
        );
        failure.deliveryUnverified = true;
        throw failure;
    }
    try {
        const imageResult = await api.sendMessage({ msg: "", attachments: paths }, threadId, type);
        if (!imageResult?.attachment?.length || imageResult.attachment.some((image) => !image?.msgId)) {
            const failure = new Error(
                "Image delivery is unverified: Zalo returned no message ID. Check the conversation before retrying.",
            );
            failure.deliveryUnverified = true;
            throw failure;
        }
        return { ...imageResult, message: textResult.message };
    } catch (cause) {
        const failure = new Error(cause.message, { cause });
        failure.code = cause.code;
        failure.deliveryUnverified = cause.deliveryUnverified;
        failure.textResult = textResult;
        throw failure;
    }
}
