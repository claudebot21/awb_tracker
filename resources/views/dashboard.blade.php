<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            {{ __('Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 text-gray-900 dark:text-gray-100">
                    {{--                    {{ __("You're logged in!") }}--}}
                    <ul class="max-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        @if(count($awbs)===0)
                            <p>There is no package to track yet...</p>
                        @endif
                        @foreach($awbs as $awb)
                            <li class="py-3 sm:pb-4">
                                <div class="flex items-center space-x-4 rtl:space-x-reverse">
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                                            {{ $awb->awb_number }} ({{ $awb->tag }})
                                        </p>
                                        <p class="text-sm text-gray-500 truncate dark:text-gray-400">
                                            @if($awb->steps->sortBy('status_date')->last())
                                                {{ $awb->steps->sortBy('status_date')->last()->status_long }}
                                                ({{ $awb->steps->sortBy('status_date')->last()->status_date }})
                                            @else
                                                No status yet.
                                            @endif
                                        </p>
                                    </div>
                                    <div class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                                        <img height="32" width="32" class="mx-5" src="{{ $awb->carrier->logo }}"/>
                                        <a href="/awb/show/{{ $awb->id }}"
                                           class="px-3 py-1 border border-blue-300 rounded-full text-blue-300 text-xs uppercase font-semibold">Track</a>
                                        <a href="/awb/delete/{{ $awb->id }}"
                                           class="mx-3 px-3 py-1 border border-red-300 rounded-full text-red-300 text-xs uppercase font-semibold">Delete</a>
                                    </div>
                                </div>
                            </li>
                        @endforeach
                    </ul>
                    {{ $awbs->links() }}
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
