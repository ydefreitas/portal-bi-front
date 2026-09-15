import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ReportSkeleton = () => {
  return (
    <Card className="h-full flex flex-col border-dashed animate-pulse">
      <CardHeader className="pb-3 flex-none">
        <div className="flex items-start justify-between mb-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>

      <CardContent className="py-0 flex-grow">
        <Skeleton className="w-full h-32 rounded-lg mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </CardContent>

      <CardFooter className="pt-4 flex-none">
        <Skeleton className="h-10 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
};

export default ReportSkeleton;
