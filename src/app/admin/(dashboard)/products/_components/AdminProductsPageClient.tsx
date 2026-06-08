"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetAdminBillingProviderProducts } from "@/api/generated/admin-billing/admin-billing";
import { AdminBillingProviderProduct } from "@/api/generated/dowin.schemas";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Card } from "@/components/ui/Card";

export default function AdminProductsPageClient() {
  const [filterEnv, setFilterEnv] = useState<string>("ALL");
  const [filterPlan, setFilterPlan] = useState<string>("ALL");

  const { data: productData, isLoading: isProductLoading } =
    useGetAdminBillingProviderProducts();

  const products: AdminBillingProviderProduct[] = Array.isArray(
    productData?.data
  )
    ? (productData.data as AdminBillingProviderProduct[])
    : [];

  const filteredProducts = products.filter((p) => {
    if (filterEnv !== "ALL" && p.environment !== filterEnv) return false;
    if (filterPlan !== "ALL" && p.planCode !== filterPlan) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-dowin-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-[28px] font-black tracking-tighter text-text-primary leading-tight">
            상품 관리
          </h1>
          <p className="text-[14px] text-text-secondary font-medium tracking-tight break-keep">
            가입 및 플랜 변경 시 사용할 결제 연동 상품(Polar product) 매핑을 관리합니다.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center h-11 px-6 text-[13px] font-black bg-text-primary text-white rounded-button transition-all w-fit"
        >
          새 상품 등록
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {["ALL", "production", "sandbox"].map((env) => (
            <button
              key={env}
              onClick={() => setFilterEnv(env)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all shadow-sm ${
                filterEnv === env
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {env === "ALL" ? "전체 환경" : env}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {["ALL", "FREE", "BASIC", "STANDARD"].map((plan) => (
            <button
              key={plan}
              onClick={() => setFilterPlan(plan)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all shadow-sm ${
                filterPlan === plan
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {plan === "ALL" ? "전체 플랜" : plan}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full">
        <Card className="bg-white border-none shadow-none rounded-[24px] overflow-hidden">
          {isProductLoading ? (
            <div className="p-12 text-center">
              <InlineSpinner />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-[13px] font-bold text-text-muted">
              등록된 상품 매핑이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-sub-background/40">
                  <tr>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Env
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Plan
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Product ID
                    </th>
                    <th className="px-6 py-4 text-[13px] font-black tracking-wider text-text-muted uppercase">
                      Active
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-border/40 hover:bg-zinc-50/50 transition-colors last:border-b-0"
                    >
                      <td className="px-6 py-4 text-[13px] font-bold text-text-primary whitespace-nowrap">
                        {product.environment}
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold text-text-primary whitespace-nowrap">
                        {product.planCode}
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold text-text-primary">
                        <code className="bg-zinc-100 px-2 py-1 rounded text-zinc-700 break-all">
                          {product.providerProductId}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black tracking-widest uppercase ${
                            product.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {product.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
