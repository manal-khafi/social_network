import React, { useState } from 'react';
import { getStories, createStory, viewStory, likeStory, unlikeStory, deleteStory } from '../api/storiesApi';

export default function TestStoriesConnection() {
    const [logs, setLogs] = useState<string[]>([]);
    const [lastStoryId, setLastStoryId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const addLog = (message: string, data?: any) => {
        const timestamp = new Date().toLocaleTimeString();
        const formattedData = data ? `\n${JSON.stringify(data, null, 2)}` : '';
        setLogs(prev => [`[${timestamp}] ${message}${formattedData}`, ...prev]);
    };

    const handleFetch = async () => {
        setLoading(true);
        try {
            addLog('Fetching all stories...');
            const stories = await getStories();
            addLog(`Success! Found ${stories.length} stories.`, stories);
            if (stories.length > 0) {
                setLastStoryId(stories[0].id);
                addLog(`Saved ID ${stories[0].id} for further tests.`);
            }
        } catch (error: any) {
            addLog('Error fetching stories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        setLoading(true);
        try {
            const url = `https://picsum.photos/seed/${Date.now()}/400/800`;
            addLog(`Creating story with URL: ${url}`);
            const newStory = await createStory({
                content_url: url,
                content_type: 'image',
                visibility: 'public',
                duration_hours: 24
            });
            addLog('Story created successfully!', newStory);
            setLastStoryId(newStory.id);
        } catch (error: any) {
            addLog('Error creating story:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleView = async () => {
        if (!lastStoryId) return addLog('No ID selected. Fetch or create a story first.');
        setLoading(true);
        try {
            addLog(`Viewing story ${lastStoryId}...`);
            await viewStory(lastStoryId);
            addLog('View registered successfully.');
        } catch (error: any) {
            addLog('Error viewing story:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!lastStoryId) return addLog('No ID selected. Fetch or create a story first.');
        setLoading(true);
        try {
            addLog(`Liking story ${lastStoryId}...`);
            await likeStory(lastStoryId);
            addLog('Like added successfully.');
        } catch (error: any) {
            addLog('Error liking story:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!lastStoryId) return addLog('No ID selected. Fetch or create a story first.');
        setLoading(true);
        try {
            addLog(`Deleting story ${lastStoryId}...`);
            await deleteStory(lastStoryId);
            addLog('Story deleted successfully.');
            setLastStoryId('');
        } catch (error: any) {
            addLog('Error deleting story:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-card text-card-foreground rounded-lg border border-border shadow-sm max-w-2xl mx-auto my-8">
            <h2 className="text-2xl font-bold mb-4">Stories API Tester</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                    onClick={handleFetch}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    1. GET All Stories
                </button>
                <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                    2. POST Create Standard Story
                </button>
                <button
                    onClick={handleView}
                    disabled={loading || !lastStoryId}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                    3. POST View (Last ID)
                </button>
                <button
                    onClick={handleLike}
                    disabled={loading || !lastStoryId}
                    className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
                >
                    4. POST Like (Last ID)
                </button>
                <button
                    onClick={handleDelete}
                    disabled={loading || !lastStoryId}
                    className="col-span-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                    5. DELETE Story (Last ID)
                </button>
            </div>

            <div className="bg-muted p-4 rounded-md h-96 overflow-y-auto font-mono text-xs whitespace-pre-wrap">
                {logs.length === 0 ? (
                    <span className="text-muted-foreground">Logs will appear here...</span>
                ) : (
                    logs.map((log, i) => <div key={i} className="mb-2 border-b border-border/50 pb-2">{log}</div>)
                )}
            </div>
        </div>
    );
}
