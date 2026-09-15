import React, { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from '@/components/ui/pagination';

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    className?: string;
    render?: (value: any, item: any) => React.ReactNode;
}

interface DataTableProps {
    data: any[];
    columns: Column[];
    searchPlaceholder?: string;
    itemsPerPage?: number;
    maxHeight?: string;
    minWidth?: string;
}

const DataTable = ({
    data,
    columns,
    searchPlaceholder = "Buscar...",
    itemsPerPage = 10,
    maxHeight = "400px",
    minWidth = "800px"
}: DataTableProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);

    // Filtrado
    const filteredData = useMemo(() => {
        return data.filter(item =>
            columns.some(column =>
                String(item[column.key] || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [data, searchTerm, columns]);

    // Ordenamiento
    const sortedData = useMemo(() => {
        if (!sortField) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }

            const aStr = String(aValue || '').toLowerCase();
            const bStr = String(bValue || '').toLowerCase();

            if (sortDirection === 'asc') {
                return aStr.localeCompare(bStr);
            } else {
                return bStr.localeCompare(aStr);
            }
        });
    }, [filteredData, sortField, sortDirection]);

    // Paginación
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages + 2) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('ellipsis1');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 3) {
                for (let i = 2; i <= 4; i++) pages.push(i);
            } else if (currentPage >= totalPages - 2) {
                for (let i = totalPages - 3; i <= totalPages - 1; i++) pages.push(i);
            } else {
                for (let i = start; i <= end; i++) pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push('ellipsis2');
            pages.push(totalPages);
        }
        return pages;
    };

    const getSortIcon = (field: string) => {
        if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1" />;
        return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />;
    };

    return (
        <div className="space-y-4">
            {/* Búsqueda */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="pl-10"
                />
            </div>

            {/* Tabla */}
            <div className="border rounded-md bg-card overflow-hidden">
                <ScrollArea style={{ height: maxHeight }} className="w-full">
                    <div style={{ minWidth }}>
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-20 shadow-sm">
                                <TableRow>
                                    {columns.map((column) => (
                                        <TableHead key={column.key} className={`font-semibold whitespace-nowrap bg-background ${column.className || ''}`}>
                                            {column.sortable ? (
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => handleSort(column.key)}
                                                    className="h-auto p-0 hover:bg-transparent font-semibold"
                                                >
                                                    {column.label}
                                                    {getSortIcon(column.key)}
                                                </Button>
                                            ) : (
                                                column.label
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.map((item, index) => (
                                    <TableRow key={item.id || item.id_user || item.id_report || item.id_group || index}>
                                        {columns.map((column) => (
                                            <TableCell key={column.key} className={`whitespace-nowrap ${column.className || ''}`}>
                                                {column.render ? column.render(item[column.key], item) : item[column.key]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                                {paginatedData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                                            No se encontraron resultados
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </ScrollArea>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(Math.max(1, currentPage - 1));
                                }}
                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>

                        {getPageNumbers().map((page, index) => (
                            <PaginationItem key={index}>
                                {typeof page === 'number' ? (
                                    <PaginationLink
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentPage(page);
                                        }}
                                        isActive={currentPage === page}
                                        className="cursor-pointer"
                                    >
                                        {page}
                                    </PaginationLink>
                                ) : (
                                    <PaginationEllipsis />
                                )}
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationNext
                                onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                                }}
                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
};

export default DataTable;
