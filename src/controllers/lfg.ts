import { Request, Response } from "express";

/**
 * GET /lfg
 * LFG page.
 */
export const index = (req: Request, res: Response) => {
    res.render("lfg/lfg", {
        title: "LFG"
    });
};
