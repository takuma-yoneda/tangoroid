export const MOCK_RESULT = {
    story: "One day, a **curious** cat decided to **explore** the **vast** garden. It found a **mysterious** box hidden behind the bushes. To its **surprise**, the box was filled with toys.",
    translation: "ある日、**好奇心旺盛(curious)**な猫が**広大(vast)**な庭を**探検(explore)**することにしました。それは茂みの後ろに隠された**不思議(mysterious)**な箱を見つけました。**驚いた(surprise)**ことに、その箱はおもちゃでいっぱいでした。"
};

export const generateMockPassage = async () => {
    return new Promise<{ story: string; translation: string }>((resolve) => {
        setTimeout(() => {
            resolve(MOCK_RESULT);
        }, 500); // Simulate network delay
    });
};
