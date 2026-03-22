import { NextApiRequest, NextApiResponse } from 'next';
import { handleLogout } from '@/lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleLogout(req, res);
}