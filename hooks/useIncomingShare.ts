import { useShareIntent } from 'expo-share-intent';

export const useIncomingShare = () => {
    const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntent({
        debug: true,
        resetOnBackground: true,
    });

    return {
        hasShareIntent,
        shareIntent,
        resetShareIntent,
        error,
    };
};
