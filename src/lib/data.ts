import { Area } from "@/types";

export const mockAreas: Area[] = [
    {
        id: "area-1",
        name: "Mitake",
        description: "A popular riverside bouldering area near Tokyo.",
        boulders: [
            {
                id: "boulder-1",
                name: "Ninja Rock",
                imageUrl: "https://placehold.co/600x400/png?text=Ninja+Rock", // Placeholder
                problems: [
                    {
                        id: "prob-1",
                        name: "Ninja Gaeshi",
                        grade: "1c",
                        description: "The classic problem of the area.",
                        lineCoordinates: [],
                    },
                    {
                        id: "prob-2",
                        name: "Kani",
                        grade: "2c",
                        description: "Traverse problem.",
                        lineCoordinates: [],
                    },
                ],
            },
            {
                id: "boulder-2",
                name: "Deadend",
                imageUrl: "https://placehold.co/600x400/png?text=Deadend",
                problems: [
                    {
                        id: "prob-3",
                        name: "Deadend",
                        grade: "1c",
                        description: "Powerful moves.",
                        lineCoordinates: [],
                    },
                ],
            },
        ],
    },
    {
        id: "area-2",
        name: "Ogawayama",
        description: "The granite paradise of Japan.",
        boulders: [
            {
                id: "boulder-3",
                name: "Whale Rock",
                imageUrl: "https://placehold.co/600x400/png?text=Whale+Rock",
                problems: [
                    {
                        id: "prob-4",
                        name: "Ana President",
                        grade: "2d",
                        description: "Slopers and mantles.",
                        lineCoordinates: [],
                    },
                ],
            },
        ],
    },
];
