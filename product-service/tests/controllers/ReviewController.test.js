"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const reviewController = __importStar(require("../../src/controllers/ReviewController"));
const Review_1 = require("../../src/models/Review");
const Product_1 = __importDefault(require("../../src/models/Product"));
// Mock models
jest.mock('../../src/models/Review');
jest.mock('../../src/models/Product');
// Mock Logger
jest.mock('@3asoftwares/utils/server', () => ({
    Logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));
describe('ReviewController', () => {
    let mockRequest;
    let mockResponse;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        responseJson = jest.fn();
        responseStatus = jest.fn().mockReturnValue({ json: responseJson });
        mockRequest = {
            query: {},
            params: {},
            body: {},
        };
        mockResponse = {
            json: responseJson,
            status: responseStatus,
        };
        jest.clearAllMocks();
    });
    describe('getProductReviews', () => {
        it('should return paginated reviews for a product', async () => {
            mockRequest.params = { productId: 'prod123' };
            const mockReviews = [
                { _id: 'rev1', rating: 5, comment: 'Great product!' },
                { _id: 'rev2', rating: 4, comment: 'Good quality' },
            ];
            Review_1.Review.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue(mockReviews),
                        }),
                    }),
                }),
            });
            Review_1.Review.countDocuments.mockResolvedValue(2);
            await reviewController.getProductReviews(mockRequest, mockResponse);
            expect(Review_1.Review.find).toHaveBeenCalledWith({ productId: 'prod123', isApproved: true });
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    reviews: mockReviews,
                    pagination: expect.objectContaining({
                        total: 2,
                    }),
                }),
            }));
        });
        it('should use custom pagination', async () => {
            mockRequest.params = { productId: 'prod123' };
            mockRequest.query = { page: '2', limit: '5' };
            Review_1.Review.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue([]),
                        }),
                    }),
                }),
            });
            Review_1.Review.countDocuments.mockResolvedValue(10);
            await reviewController.getProductReviews(mockRequest, mockResponse);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    pagination: expect.objectContaining({
                        page: 2,
                        limit: 5,
                    }),
                }),
            }));
        });
        it('should handle errors', async () => {
            mockRequest.params = { productId: 'prod123' };
            Review_1.Review.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                            lean: jest.fn().mockRejectedValue(new Error('Database error')),
                        }),
                    }),
                }),
            });
            await reviewController.getProductReviews(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(500);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Failed to get reviews',
            }));
        });
    });
    describe('createReview', () => {
        const validReviewData = {
            userId: 'user123',
            userName: 'Test User',
            rating: 5,
            comment: 'Excellent product!',
        };
        it('should create a review successfully', async () => {
            mockRequest.params = { productId: 'prod123' };
            mockRequest.body = validReviewData;
            Product_1.default.findById.mockResolvedValue({ _id: 'prod123', name: 'Test Product' });
            Review_1.Review.findOne.mockResolvedValue(null);
            const mockSave = jest.fn().mockResolvedValue(true);
            Review_1.Review.mockImplementation(() => ({
                ...validReviewData,
                productId: 'prod123',
                save: mockSave,
            }));
            Review_1.Review.find.mockResolvedValue([{ rating: 5 }, { rating: 4 }]);
            Product_1.default.findByIdAndUpdate.mockResolvedValue({});
            await reviewController.createReview(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(201);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Review submitted successfully',
            }));
        });
        it('should return 404 if product not found', async () => {
            mockRequest.params = { productId: 'nonexistent' };
            mockRequest.body = validReviewData;
            Product_1.default.findById.mockResolvedValue(null);
            await reviewController.createReview(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(404);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Product not found',
            }));
        });
        it('should return 400 if user already reviewed product', async () => {
            mockRequest.params = { productId: 'prod123' };
            mockRequest.body = validReviewData;
            Product_1.default.findById.mockResolvedValue({ _id: 'prod123' });
            Review_1.Review.findOne.mockResolvedValue({ _id: 'existingReview' });
            await reviewController.createReview(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'You have already reviewed this product',
            }));
        });
        it('should handle duplicate key error', async () => {
            mockRequest.params = { productId: 'prod123' };
            mockRequest.body = validReviewData;
            Product_1.default.findById.mockResolvedValue({ _id: 'prod123' });
            Review_1.Review.findOne.mockResolvedValue(null);
            const duplicateError = new Error('Duplicate key');
            duplicateError.code = 11000;
            Review_1.Review.mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(duplicateError),
            }));
            await reviewController.createReview(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'You have already reviewed this product',
            }));
        });
    });
    describe('markReviewHelpful', () => {
        it('should mark review as helpful', async () => {
            mockRequest.params = { reviewId: 'rev123' };
            const updatedReview = {
                _id: 'rev123',
                helpful: 6,
            };
            Review_1.Review.findByIdAndUpdate.mockResolvedValue(updatedReview);
            await reviewController.markReviewHelpful(mockRequest, mockResponse);
            expect(Review_1.Review.findByIdAndUpdate).toHaveBeenCalledWith('rev123', { $inc: { helpful: 1 } }, { new: true });
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Review marked as helpful',
            }));
        });
        it('should return 404 if review not found', async () => {
            mockRequest.params = { reviewId: 'nonexistent' };
            Review_1.Review.findByIdAndUpdate.mockResolvedValue(null);
            await reviewController.markReviewHelpful(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(404);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Review not found',
            }));
        });
        it('should handle errors', async () => {
            mockRequest.params = { reviewId: 'rev123' };
            Review_1.Review.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));
            await reviewController.markReviewHelpful(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(500);
        });
    });
    describe('deleteReview', () => {
        it('should delete review successfully', async () => {
            mockRequest.params = { reviewId: 'rev123' };
            mockRequest.body = { userId: 'user123' };
            const existingReview = {
                _id: 'rev123',
                userId: 'user123',
                productId: 'prod123',
            };
            Review_1.Review.findById.mockResolvedValue(existingReview);
            Review_1.Review.findByIdAndDelete.mockResolvedValue(existingReview);
            Review_1.Review.find.mockResolvedValue([{ rating: 4 }]);
            Product_1.default.findByIdAndUpdate.mockResolvedValue({});
            await reviewController.deleteReview(mockRequest, mockResponse);
            expect(Review_1.Review.findByIdAndDelete).toHaveBeenCalledWith('rev123');
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Review deleted successfully',
            }));
        });
        it('should return 404 if review not found', async () => {
            mockRequest.params = { reviewId: 'nonexistent' };
            mockRequest.body = { userId: 'user123' };
            Review_1.Review.findById.mockResolvedValue(null);
            await reviewController.deleteReview(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(404);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Review not found',
            }));
        });
        it('should return 403 if user does not own review', async () => {
            mockRequest.params = { reviewId: 'rev123' };
            mockRequest.body = { userId: 'differentUser' };
            const existingReview = {
                _id: 'rev123',
                userId: 'user123',
                productId: 'prod123',
            };
            Review_1.Review.findById.mockResolvedValue(existingReview);
            await reviewController.deleteReview(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(403);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'You can only delete your own reviews',
            }));
        });
        it('should reset product rating when no reviews left', async () => {
            mockRequest.params = { reviewId: 'rev123' };
            mockRequest.body = { userId: 'user123' };
            const existingReview = {
                _id: 'rev123',
                userId: 'user123',
                productId: 'prod123',
            };
            Review_1.Review.findById.mockResolvedValue(existingReview);
            Review_1.Review.findByIdAndDelete.mockResolvedValue(existingReview);
            Review_1.Review.find.mockResolvedValue([]); // No reviews left
            Product_1.default.findByIdAndUpdate.mockResolvedValue({});
            await reviewController.deleteReview(mockRequest, mockResponse);
            expect(Product_1.default.findByIdAndUpdate).toHaveBeenCalledWith('prod123', {
                rating: 0,
                reviewCount: 0,
            });
        });
        it('should handle errors', async () => {
            mockRequest.params = { reviewId: 'rev123' };
            mockRequest.body = { userId: 'user123' };
            Review_1.Review.findById.mockRejectedValue(new Error('Database error'));
            await reviewController.deleteReview(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(500);
        });
    });
});
//# sourceMappingURL=ReviewController.test.js.map