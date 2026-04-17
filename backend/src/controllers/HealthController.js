export class HealthController {
  check(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          status: 'OK',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const healthController = new HealthController();
